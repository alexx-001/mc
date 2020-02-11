import jQuery from "jquery";
window.$ = window.jQuery = jQuery;

import Postmonger from 'postmonger';

// export for others scripts to use
window.$ = $;
window.jQuery = jQuery;

'use strict';

var connection = new Postmonger.Session();
var payload = {};

var exampleInitializeData = {
  arguments: {
    executionMode: "{{Context.ExecutionMode}}",
    definitionId: "{{Context.DefinitionId}}",
    activityId: "{{Activity.Id}}",
    contactKey: "{{Context.ContactKey}}",
    execute: {
      inArguments: [{
        ping: {
          text: "Dong!",
          value: "dong"
        }
      }],
      outArguments: []
    },
    startActivityKey: "{{Context.StartActivityKey}}",
    definitionInstanceId: "{{Context.DefinitionInstanceId}}",
    requestObjectId: "{{Context.RequestObjectId}}"
  }
};

$(window).ready(onRender);

// All Postmonger events that the Custom Activity recieve:
// https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-app-development.meta/mc-app-development/using-postmonger.htm
connection.on('initActivity', initialize);
connection.on('clickedNext', save);

/**
 * Simple onReady This function will alert the
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
function onRender(e) {
  connection.trigger('ready');

  // To Test Locally uncomment this line
  //initialize(exampleInitializeData);
}

function updateNextButton(force) {
  // we can update the botton to say 'done' once the
  // user has filled out all the controls properly.
  var isDone = (force || getMessage());
  console.log('Updated Button to', isDone ? 'done' : 'next')

  connection.trigger('updateButton', {
    button: 'next',
    text: isDone ? 'done' : 'next',
    enabled: Boolean(isDone)
  });
}

function initialize(data) {

  if (data) {
    payload = data;
  }

  console.log('-------- Initialize --------');
  console.log('data', JSON.stringify(data));
  console.log('----------------------------');

  var hasInArguments = Boolean(
    payload['arguments'] &&
    payload['arguments'].execute &&
    payload['arguments'].execute.inArguments &&
    payload['arguments'].execute.inArguments.length > 0
  );

  var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

  function getArg(inArguments, arg) {
    var toReturn;
    $.each(inArguments, function(index, inArgument) {
      if (!toReturn) {
        $.each(inArgument, function(key, val) {
          if (key === arg) {
            toReturn = val;
          }
        });
      }
    });
    return toReturn;
  }

  var ping = getArg(inArguments, 'ping');

  if (ping && ping.value) {
    // If there is a message, skip to the summary step
    $('#ping').combobox('selectByValue', ping.value);
  } else if (ping && ping.text) {
    $('#ping :text').val(ping.text);
  }

  // update the next button upon load.
  updateNextButton();

  // update the next button should the inputs change.
  $('#ping').on('changed.fu.combobox', updateNextButton);
  $('#ping :text').on('keypress', function() {
    updateNextButton($('#ping :text').val() !== "");
  });
}

function save() {
  // 'payload' is initialized on 'initActivity' above.
  // Journey Builder sends an initial payload with defaults
  // set by this activity's config.json file.  Any property
  // may be overridden as desired.
  payload.name = name;

  payload['arguments'].execute.inArguments = [{
    "ping": getMessage()
  }];

  payload['metaData'].isConfigured = true;

  connection.trigger('updateActivity', payload);
}

function getMessage() {
  // We will only return the message if they have typed in a message or selected
  // it from the list.
  var selection = $('#ping').combobox('selectedItem');
  if (selection.text !== "") {
    return selection;
  }
}
