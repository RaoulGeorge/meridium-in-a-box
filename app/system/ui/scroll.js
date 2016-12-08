define(function (require) {
    'use strict';

    var _ = require('lodash');

    var $ = require('jquery');

    var Device = require('system/hardware/device');

    var defaultOptions = {
        hScrollbar: false
    };

    function Scroll(options) {
        this.options = options || {};
        this.platform = new Device();
    }

    Scroll.prototype.apply = function (element) {
        var dfd = $.Deferred();

        setElement(this, element);
        _.defer(function () {
            this.$element.css({
                'overflow-y': 'auto',
                '-webkit-overflow-scrolling': 'touch',
                '-webkit-transform': 'translate3d(0, 0, 0)',
                'transform': 'translate3d(0, 0, 0)'
            });

            if (this.platform.isAndroid()) {
                $('html').addClass('android-scroll-bar');
            }

            buildOptions(this);
            dfd.resolve();
        }.bind(this));

        return dfd.promise();
    };

    function setElement(self, element) {
        self.element = element instanceof $ ? element.get(0) : element;
        self.$element = element instanceof $ ? element : $(element);
    }

    function buildOptions(self) {
        var options = _.extend({}, defaultOptions, self.options);

        if (options.hScrollbar === false) {
            self.$element.css({
                'overflow-x': 'hidden'
            });
        }

        initPullToRefresh(self, options);

        return options;
    }

    function initPullToRefresh(self, options) {
        if (!options.onPullToRefresh) { return; }

        var statusHTML = '<aside id="refresh-status" style="position:relative;  width:300px; height:0px;">' +
                '<label>Pull down to refresh...</label></aside>',
            hasNoStatusDiv = ($('aside').length === 0),
            clicking = false,
            $elem = $(self.element),
            $wrapperElem = $elem.find('ul'),
            mouseHistory = [],
            pullDownEl, label, totalMouseMovement, needsPullReset, needsToBePulled, notEnoughMouseMovement,
            scrollAtTopOfDiv;

        if (hasNoStatusDiv) {
            $elem.prepend(statusHTML);
            $('#refresh-status').hide();
        }

        pullDownEl = $('aside');
        label = $('aside label');
        needsPullReset = (pullDownEl.attr('class') === 'loading');

        if (needsPullReset) {
            resetPull(self, pullDownEl, label, $wrapperElem);
        }

        if (self.platform.isMobile()) {
            attachPullToRefreshMobile(self, options, $elem, clicking, mouseHistory, totalMouseMovement,
                needsToBePulled, pullDownEl, notEnoughMouseMovement, scrollAtTopOfDiv, label, $wrapperElem);
        } else {
            attachPullToRefreshDesktop(self, options, $elem, clicking, mouseHistory, totalMouseMovement,
                needsToBePulled, pullDownEl, notEnoughMouseMovement, scrollAtTopOfDiv, label, $wrapperElem);
        }
    }

    function attachPullToRefreshMobile(self, options, $elem, clicking, mouseHistory, totalMouseMovement,
        needsToBePulled, pullDownEl, notEnoughMouseMovement, scrollAtTopOfDiv, label, $wrapperElem) {
        var scrollList = $elem.get(0);

        scrollList.addEventListener('touchstart', function () {
            clicking = true;
        });

        scrollList.addEventListener('touchmove', function (e) {
            if (clicking === false) { return; }
            mouseHistory.push(e.touches[0].clientY);

            totalMouseMovement = getMousePositionDelta(mouseHistory[0], mouseHistory[mouseHistory.length - 1]);
            needsToBePulled = (totalMouseMovement > 5 &&
                (pullDownEl.attr('class') !== 'flip' || !pullDownEl.attr('class')));
            notEnoughMouseMovement = (totalMouseMovement < 5 && pullDownEl.attr('class') === 'flip');
            scrollAtTopOfDiv = (self.element.scrollTop === 0);

            listenForPull(self, scrollAtTopOfDiv, needsToBePulled, pullDownEl, label, $wrapperElem,
                notEnoughMouseMovement);
        });

        scrollList.addEventListener('touchend', function () {
            clicking = false;
            mouseHistory = [];

            if (pullDownEl.attr('class') === 'flip') {
                executeRefresh(this, pullDownEl, label, options);
            }
        });
    }

    function attachPullToRefreshDesktop(self, options, $elem, clicking, mouseHistory, totalMouseMovement,
        needsToBePulled, pullDownEl, notEnoughMouseMovement, scrollAtTopOfDiv, label, $wrapperElem) {
        $elem.mousedown(function () {
            clicking = true;
        });

        $elem.mousemove(function (e) {
            if (clicking === false) { return; }

            mouseHistory.push(e.clientY);

            totalMouseMovement = getMousePositionDelta(mouseHistory[0], mouseHistory[mouseHistory.length - 1]);
            needsToBePulled = (totalMouseMovement > 5 &&
                (pullDownEl.attr('class') !== 'flip' || !pullDownEl.attr('class')));
            notEnoughMouseMovement = (totalMouseMovement < 5 && pullDownEl.attr('class') === 'flip');
            scrollAtTopOfDiv = (self.element.scrollTop === 0);

            listenForPull(self, scrollAtTopOfDiv, needsToBePulled, pullDownEl, label, $wrapperElem,
                notEnoughMouseMovement);
            e.preventDefault();
        });

        $(document).mouseup(function () {
            clicking = false;
            mouseHistory = [];

            if (pullDownEl.attr('class') === 'flip') {
                executeRefresh(this, pullDownEl, label, options);
            }
        });
    }

    function listenForPull(self, scrollAtTopOfDiv, needsToBePulled, pullDownEl, label, $wrapperElem,
        notEnoughMouseMovement) {
        if (scrollAtTopOfDiv) {
            if (needsToBePulled) {
                pullDivDown(self, pullDownEl, label, $wrapperElem);
                $('#refresh-status').show();
            } else if (notEnoughMouseMovement) {
                resetPull(self, pullDownEl, label, $wrapperElem);
                $('#refresh-status').hide();
            }
        }
    }

    function pullDivDown(self, pullDownEl, label, $wrapperElem) {
        $wrapperElem.css('margin-top', '20px');
        pullDownEl.attr('class', 'flip');
        label.html('Release to refresh...');
    }

    function executeRefresh(self, pullDownEl, label, options) {
        pullDownEl.attr('class', 'loading');
        label.html('Loading...');
        options.onPullToRefresh(self);
    }

    function resetPull(self, pullDownEl, label, $wrapperElem) {
        pullDownEl.attr('class', '');
        label.html('Pull down to refresh...');
        $wrapperElem.css('margin-top', '0');
        $('#refresh-status').hide();
    }

    function getMousePositionDelta(y1, y2) {
        return y2 - y1;
    }

    return Scroll;
});