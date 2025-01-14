'use strict';
let settings = {};

// An optimization to cache the parsed rules.
vAPI.getSettings(['whitelist', 'behavior', 'isDevelopment'], settingsResponse => {
    settings = settingsResponse;
    if (settings.whitelist) {
        try {
            settings.whitelist = parseRules(settings.whitelist);
        } catch (e) {
            console.error(e);
        }
    }
    if (!settings.behavior) {
        // Assume that devices without touch have a mouse
        const hasTouch = 'ontouchstart' in window;
        settings.behavior = hasTouch ? 'scroll' : 'hover';
        vAPI.updateSettings({behavior: settings.behavior});
    }

    vAPI.listen('getSettings', (message, sendResponse) => {
        let response = _.pick(settings, 'behavior', 'isDevelopment');
        if (settings.whitelist) {
            response.whitelist = matchWhitelist(settings.whitelist, message.location);
        }
        sendResponse('settings', response);
    });
});

vAPI.listen('updateSettings', (message, sendResponse) => {
    // Apply settings to the settings object
    if (message.whitelist) {
        try {
            settings.whitelist = parseRules(message.whitelist);
        } catch (e) {
            // TODO: replace with promise
            sendResponse('invalidSettings', e.message);
            return;
        }
    }
    if (message.behavior) {
        settings.behavior = message.behavior;
    }

    vAPI.updateSettings(message);

    // Update all tabs only if the behavior changed.
    if (message.behavior) {
        vAPI.sendSettings({behavior: message.behavior});
    }
    // TODO: replace with promise
    sendResponse('acceptedSettings');
});
vAPI.listen('exploreSheet', (message, sendResponse) => {
    let explorer = new Explorer(result => {
        sendResponse('sheetExplored', result);
    });
    explorer.fetchStylesheet(message.href, message.baseURI);
});