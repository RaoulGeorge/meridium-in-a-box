define(function (require) {
    'use strict';

    var m = require('mithril'),
        HasAppEvents = require('application/mixins/has-app-events'),
        Translator = require('system/globalization/translator'),
        ErrorNotificationHandler = require('logging/error-notification-handler');

    function MithrilViewModel(view) {
        HasAppEvents.mixinProperties(this);
        this.view = view;
        this.translator = Object.resolve(Translator);
        this.errorNotificationHandler = Object.resolve(ErrorNotificationHandler);
        this.mithrilRoot = null;
    }

    HasAppEvents.mixinMethods(MithrilViewModel.prototype);

    MithrilViewModel.prototype.attach = function screen_attach(region) {
        Object.tryMethod(this, 'beforeAttach', region);
        this.mithrilRoot = Element.build('div', null, ['mithril-root']);
        region.attach(this.mithrilRoot);
        m.mount(this.mithrilRoot, {
            controller: controller.bind(null, this),
            view: this.view
        });
        Object.tryMethod(this, 'afterAttach', region);
    };

    MithrilViewModel.prototype.detach = function screen_detach(region) {
        Object.tryMethod(this, 'beforeDetach', region);
        m.mount(this.mithrilRoot, null);
        this.mithrilRoot = null;
        region.clear();
        Object.tryMethod(this, 'afterDetach', region);
    };

    MithrilViewModel.prototype.translate = function ManagedViewModel_translate(key) {
        return this.translator.translate(key);
    };

    function controller(self) {
        return self;
    }

    return MithrilViewModel;
});