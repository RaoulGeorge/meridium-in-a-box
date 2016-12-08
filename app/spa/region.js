define(["require", "exports", "jquery"], function (require, exports, $) {
    "use strict";
    var COMMENT_NODE = 8;
    var Region = (function () {
        function Region(element) {
            this.element = null;
            this.$element = null;
            this.setElement(element);
            this.activeContainer = null;
            this.screen = null;
        }
        Region.prototype.setElement = function (element) {
            var regionElement = initRegionElement(element);
            this.element = convertToNativeDomElement(regionElement);
            this.$element = convertToJQueryElement(regionElement);
            deleteContents(this);
        };
        Region.prototype.attach = function (element) {
            this.clear();
            this.activeContainer = createActiveContainer();
            appendContentToActiveContainer(this, element);
            appendActiveContainerToRegionElement(this);
        };
        Region.prototype.clear = function () {
            if (!this.activeContainer) {
                return;
            }
            disposeActiveContainer(this);
            deleteContents(this);
        };
        Region.prototype.remove = function () {
            if (!this.$element) {
                throw new Error('region.$element is null');
            }
            this.$element.remove();
        };
        Region.prototype.dispose = function () {
            this.clear();
            this.detach();
            this.screen = null;
        };
        Region.prototype.detach = function () {
            this.element = null;
            this.$element = null;
        };
        Region.prototype.removeAndDispose = function () {
            this.remove();
            this.dispose();
        };
        return Region;
    }());
    function initRegionElement(element) {
        return element || document.createElement('div');
    }
    function convertToNativeDomElement(element) {
        return isJQueryElement(element) ? getUnderlyingDomElement(element) : element;
    }
    function isJQueryElement(element) {
        return element instanceof $;
    }
    function getUnderlyingDomElement($element) {
        return $element.get(0);
    }
    function convertToJQueryElement(element) {
        return isJQueryElement(element) ? element : $(element);
    }
    function deleteContents(region) {
        if (!region.$element) {
            throw new Error('region.$element is null');
        }
        region.$element.empty();
    }
    function createActiveContainer() {
        var element = document.createElement('div');
        element.classList.add('region');
        return element;
    }
    function appendContentToActiveContainer(region, element) {
        $(region.activeContainer).append(element);
    }
    function appendActiveContainerToRegionElement(region) {
        if (isComment(region.element)) {
            if (!region.$element) {
                throw new Error('region.$element is null');
            }
            region.$element.after(region.activeContainer);
        }
        else {
            if (!region.element) {
                throw new Error('region.element is null');
            }
            region.element.appendChild(region.activeContainer);
        }
    }
    function isComment(element) {
        return element.nodeType === COMMENT_NODE;
    }
    function disposeActiveContainer(region) {
        $(region.activeContainer).remove();
        region.activeContainer = null;
    }
    return Region;
});
