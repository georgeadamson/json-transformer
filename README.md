# JSONTransformer - Convert JSON to a new shape. [![Build Status][ci-img]][ci]

[ci-img]:  https://travis-ci.org/georgeadamson/json-transformer.svg
[ci]:      https://travis-ci.org/georgeadamson/json-transformer

Define your new JSON shape simply as a JS object, using ${interpolation} or functions to generate new property values.
<br>
Your template defines the new json format.

### Syntax
```js
import JSONTransformer from 'json-transformer'

JSONTransformer.transform(json, template [, config])
```

Note:
- The `json` argument can be an *object* or a valid json *string*.
- The `template` object represents the shape of your desired json output.


### Example
```js
var json = { "firstName": "Fred", "lastName": "Flintstone" }
var tmpl = { "greeting": "My name is ${firstName} ${lastName}" }

var result = JSONTransformer.transform(json, tmpl)

// result:
{ greeting: "My name is Fred Flintstone" }
```

### Example with nesting and functions
```js
var json = {
  name: {
    first: "Fred",
    last: "Flintstone"
  },
  dateOfBirth: "2000-01-01"
}

var tmpl = {
  name: "My name is ${name.first} ${name.first}",
  greeting: function(json){
    var dob = json.dateOfBirth.
    return 'Yay ' + json.name.first + ', you were born on ' + json.dob.toDateString()
  }
};

var result = JSONTransformer.transform(json, tmpl);

// result:
{ name: "Fred Flintstone", greeting: "Yay Fred, you were born on Sat Jan 01 2000" }
```


### Config options

You can override any default config option(s) by supplying a map of one or more key:value pairs like this:

```js
var config = {
  ignoreFunctions            : false, // Specify true to skip properties that are defined in your template as functions.
  ignoreEmptyObjects         : false, // Specify true to omit empty objects from the result.
  ignoreEmptyArrays          : false, // Specify true to omit empty arrays from the result.
  ignoreUnderscoreProperties : false  // Specify true to omit any properties that begin with an underscore.
}
```


### Credits
Inspired by and adapted from http://www.openwebosproject.org/docs/developer_reference/foundations/json_transformer/#transformer.transform
Although functional, more work is required to tidy up some of the old code.
