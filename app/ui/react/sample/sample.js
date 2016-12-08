define(function (require) {
    'use strict';

    var React = require('react'),
        ReactDOM = require('react-dom');

    var div = React.DOM.div,
        input = React.DOM.input,
        span = React.DOM.span,
        ul = React.DOM.ul,
        li = React.DOM.li,
        icon = React.DOM.i;

    function Sample() {
        this.state = {}; //Mutable object
        this.props = {}; //Immutable object
        //With only props can build stateless components
        //props and state helps to build stateful components

        this.isComponentMounted = false;
    }

    var base = Object.inherit(React.Component, Sample);

    var prototype = Sample.prototype;

    //prototype.getInitialState = function () {
        //ONLY SUPPORTED ON REACT.CREATECLASS
        //fires once before attach 
        //return values treated as state to render
    //};

    //prototype.getDefaultProps = function () {
        //ONLY SUPPORTED ON REACT.CREATECLASS
        //fires once before create
        //return value merges with specified props by parent
    //};

    prototype.componentWillMount = function () {
        //fires before attach
    };

    prototype.componentDidMount = function () {
        //fires after attach
        var element = ReactDOM.findDOMNode(this);
        //console.log(element);  

        var self = this;
        self.isComponentMounted = true;
    };

    prototype.componentWillReceiveProps = function () {
        //fires before receive new props
        var updatedStateProps = {}; //derived from props
        this.setState(updatedStateProps); //Helps to re-render, modifying directly won't call render and its bad prectice

        //this.replaceState(); //==> to replace state object, calls render
        //this.isMounted(); //==> to get the status of component attach
        //this.forceUpdate() //==> to forcefully call the component render method 
    };

    prototype.shouldComponentUpdate = function (nextProps, state) {
        //Decide to update or not
        return true;
    };
    
    prototype.componentWillUpdate = function () {
        //fires before update
    };

    prototype.componentDidUpdate = function () {
        //fires after update
    };

    prototype.componentWillUnmount = function () {
        //fires before detach
        var self = this;
        self.isComponentMounted = false;
    };


    prototype.render = function () {
        //Required method
        //Should return single child element to render
        //Should not modify state or DOM
        return div({});
    };

    return Sample;
});