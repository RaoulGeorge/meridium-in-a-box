define(function (require) {
    'use strict';

    var R = require('ramda'),
        NavigationViewModel = require('shell/navigation-view-model');

    var navigationViewModel;

    var isAnchorTag = R.compose(R.equals('A'), R.prop('nodeName'));

    var getAttribute = R.invoker(1, 'getAttribute');

    var getHref = getAttribute('href');

    var substr = R.invoker(1, 'substr');

    var removeHash = substr(1);

    var getHrefNoHash = R.compose(removeHash, getHref);

    var startsWith = R.invoker(1, 'startsWith');

    var startsWithHash = R.compose(startsWith('#'), R.defaultTo(''));

    var startsWithBang = R.compose(startsWith('!'), R.defaultTo(''));

    var hasBang = R.compose(startsWithBang, getHref);

    var hasHashTag = R.compose(startsWithHash, getHref);

    var getTarget = getAttribute('target');

    var openNewTab = R.compose(R.equals('tab'), getTarget);

    function getParentElement (target) {
        return R.isNil(target) ? false : [target, isAnchorTag(target) ? null : target.parentElement];
    }

    var getClosestAnchorTag = R.compose(R.last, R.unfold(getParentElement));

    var shouldHandle = R.cond([[R.isNil, R.F], [hasHashTag, R.T], [hasBang, R.T], [R.T, R.F]]);

   function navigate (tag) {
       var openTab = R.compose(navigationViewModel.openTab.bind(navigationViewModel, hasBang(tag)), getHrefNoHash),
           changeTab = R.compose(navigationViewModel.changeTab.bind(navigationViewModel, hasBang(tag)), getHrefNoHash), 
           updateTabs = R.cond([[openNewTab, openTab], [R.T, changeTab]]);

       updateTabs(tag);
       return true;
   }

    var handleEventMatch = R.cond([
        [R.isNil, R.always(undefined)],
        [R.compose(R.not, isAnchorTag), R.always(undefined)],
        [shouldHandle, navigate],
        [R.T, R.always(undefined)]
    ]);

    var handleEvent = R.compose(handleEventMatch, getClosestAnchorTag, R.prop('target'));

    function ContentNavigationTask () {
    }

    var executeMatch = R.cond([
        [R.prop('defaultPrevented'), R.always(undefined)],
        [R.T, handleEvent]
    ]);

    ContentNavigationTask.prototype.execute = function (e) {
        navigationViewModel = R.defaultTo(navigationViewModel, Object.resolve(NavigationViewModel));
        if (executeMatch(e)) {
            e.preventDefault();
        }
    };

    return ContentNavigationTask;
});
