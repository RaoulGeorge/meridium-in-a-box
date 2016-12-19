

/*tsc --jsx react --sourceMap app\hello-world\ui\hello-react.tsx*/

import React = require("react");
import ReactDOM = require("react-dom");

class HelloWorldProps {
    public firstname: string;
    public lastname: string;
}

class HelloWorld extends React.Component<HelloWorldProps, any> {
    render() {
        return <div>
            Hello {this.props.firstname} {this.props.lastname}!
        </div>
    }
}

export = HelloWorld;
/*
ReactDOM.render(<HelloWorld
        firstname="John"
        lastname="Smith"/>,
    document.getElementById('app'));

    */