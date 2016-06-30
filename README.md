# JSONTransformer - Convert JSON to a new shape.

Define your new JSON shape simply as a JS object, using ${interpolation} or functions to generate new property values.
<br>
Your template defines the new json format.

### Syntax
```js
import JSONTransformer from 'json-transformer';

JSONTransformer.transform(json, template [, config]);
```
Note that the json argument can be a js **object** or a valid json **string**.

### Example
```js
var json = { "firstName": "Fred", "lastName": "Flintstone" };
var tmpl = { "greeting": "My name is ${firstName} ${lastName}" };

JSONTransformer.transform(json, tmpl);

// Result:
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
};
var tmpl = {
  name: "My name is ${name.first} ${name.first}",
  greeting: function(json){
    var dob = json.dateOfBirth.
    return 'Yay ' + json.name.first + ', you were born on ' + json.dob.toDateString();
  }
};

JSONTransformer.transform(json, tmpl);

// Result:
{ name: "Fred Flintstone", greeting: "Yay Fred, you were born on Sat Jan 01 2000" }
```

### Config options

You can override any default config option(s) by supplying values in a map like this one:

```js
{
  ignoreFunctions            : false, // Specify true to skip properties that are defined in your template as functions.
  ignoreEmptyObjects         : false, // Specify true to omit empty objects from the result.
  ignoreEmptyArrays          : false, // Specify true to omit empty arrays from the result.
  ignoreUnderscoreProperties : false  // Specify true to omit any properties that begin with an underscore.
}
```


### Credits
Inspired by and adapted from http://www.openwebosproject.org/docs/developer_reference/foundations/json_transformer/#transformer.transform
Although functional, more work is required to tidy up some of the old code.
