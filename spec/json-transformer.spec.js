/* eslint-disable */

import JSONTransformer, { DEFAULT_CONFIG } from '../lib/index.js';


// Sample data for testing:
const props = []

describe('json-transformer', function() {

  const EXPECTED_CONFIG = {
    ignoreFunctions            : false,
  	ignoreEmptyObjects         : false,
  	ignoreEmptyArrays          : false,
  	ignoreUnderscoreProperties : false,
  	ignorePartialObjects       : false	// <-- Deprecate this?
  }

  it('should have default config settings', function () {
    expect(DEFAULT_CONFIG).toEqual(EXPECTED_CONFIG);
  });

  it('should have a JSONTransformer object with a transform() method', function () {
    expect( {}.toString.call(JSONTransformer)           ).toBe('[object Object]');
    expect( {}.toString.call(JSONTransformer.transform) ).toBe('[object Function]');
  });

  it('should return json as-is when no template specified', function () {
    const json = { 'firstName': 'Whatever', 'lastName': 'Whatever' };
    expect( JSONTransformer.transform(json) ).toEqual(json);
  });

  it('should transform simple template with no transformations', function () {
    const json = { 'firstName': 'Whatever', 'lastName': 'Whatever' };
    const tmpl = { greeting: 'My name is Fred Flintstone' };
    const expectedResult = Object.assign({}, tmpl); // Expect identical copy of tmpl
    expect( JSONTransformer.transform({}, {}) ).toEqual({});
    expect( JSONTransformer.transform(json, tmpl) ).toEqual(expectedResult);
  });

  it('should transform template string ${literals}', function () {
    const json = { 'firstName': 'Fred', 'lastName': 'Flintstone' };
    const tmpl = { greeting: 'My name is ${firstName} ${lastName}' };
    const expectedResult = { greeting: 'My name is Fred Flintstone' };
    expect( JSONTransformer.transform(json,tmpl) ).toEqual(expectedResult);
  });

  it('should transform template string ${literals} in arrays too', function () {
    const json = { 'firstName': ['Barney', 'Top', 'Fred'], 'lastName': ['Rubble', 'Cat', { value: 'Flintstone' }] };
    const tmpl = { greeting: 'My name is ${firstName[2]} ${lastName[2].value}' };
    const expectedResult = { greeting: 'My name is Fred Flintstone' };
    expect( JSONTransformer.transform(json,tmpl) ).toEqual(expectedResult);
  });

  it('should transform template namespaced ${string.literals}', function () {
    const json = { person: { 'firstName': 'Fred', foo: { bar: {'lastName' : 'Flintstone'} } } };
    const tmpl = { greeting: 'My name is ${person.firstName} ${person.foo.bar.lastName}' };
    const expectedResult = { greeting: 'My name is Fred Flintstone' };
    expect( JSONTransformer.transform(json,tmpl) ).toEqual(expectedResult);
  });

  it('should transform template namespaced ${string.literals}', function () {
    const json = { person: {'displayName' : 'Fred', surname : 'Flintstone', building:'3-1' }};
    const tmpl = { user: { FirstName: '${person.displayName}', LastName: '${person.surname}', Country : 'USA', State:'CA', Location: '${person.building}' } };
    const expectedResult = { user: Object({ FirstName: 'Fred', LastName: 'Flintstone', Country: 'USA', State: 'CA', Location: '3-1' }) };
    expect( JSONTransformer.transform(json,tmpl) ).toEqual(expectedResult);
  });

  it('should transform template functions', function () {
    const json = { 'firstName': 'Fred', 'lastName' : 'Flintstone' };
    const tmpl2 = { greeting: function(json){ return 'My name is ' + json.firstName + ' ' + json.lastName } };
    const expectedResult = { greeting: 'My name is Fred Flintstone' };
    expect( JSONTransformer.transform(json,tmpl2) ).toEqual(expectedResult);
  });

  it('should pass the json as an argument to any template functions', function () {
    const json = { 'firstName': 'Fred', 'lastName' : 'Flintstone' };
    const tmpl = { greeting: function(json){ return json } };
    const expectedResult = { greeting: 'My name is Fred Flintstone' };
    expect( JSONTransformer.transform(json,tmpl) ).toEqual({ greeting: json });
  });

  it('should honour config setting: ignoreEmptyObjects', function () {
    expect( JSONTransformer.transform({}, {},             { ignoreEmptyObjects: false }) ).toEqual({});
    expect( JSONTransformer.transform({}, {},             { ignoreEmptyObjects: true  }) ).toBe(undefined);
    expect( JSONTransformer.transform({}, {foo:{}},       { ignoreEmptyObjects: false }) ).toEqual({foo:{}});
    expect( JSONTransformer.transform({}, {foo:{}},       { ignoreEmptyObjects: true  }) ).toBe(undefined);
    expect( JSONTransformer.transform({}, {foo:{},bar:1}, { ignoreEmptyObjects: true  }) ).toEqual({bar:1});
  });

  it('should honour config setting: ignoreEmptyArrays', function () {
    expect( JSONTransformer.transform([], [],       { ignoreEmptyArrays: false }) ).toEqual([]);
    expect( JSONTransformer.transform([], [],       { ignoreEmptyArrays: true  }) ).toEqual(undefined);
    expect( JSONTransformer.transform([], {foo:[]}, { ignoreEmptyArrays: false }) ).toEqual({foo:[]});
    expect( JSONTransformer.transform([], {foo:[]}, { ignoreEmptyArrays: true  }) ).toEqual({});
  });

  it('should honour config setting: ignoreUnderscoreProperties', function () {
    expect( JSONTransformer.transform({}, {_foo:{}}, { ignoreUnderscoreProperties: false }) ).toEqual({_foo:{}});
    expect( JSONTransformer.transform({}, {_foo:{}}, { ignoreUnderscoreProperties: true  }) ).toEqual({});
  });

  it('should honour config setting: ignoreFunctions', function () {
    expect( JSONTransformer.transform({foo:10}, {bar: function(json){ return json.foo * 2 } }, { ignoreFunctions: false }) ).toEqual({bar:20});
    expect( JSONTransformer.transform({foo:10}, {bar: function(json){ return json.foo * 2 } }, { ignoreFunctions: true  }) ).toEqual({});
  });

  it('should execute functions in a custom context if specified', function () {
    var context = { foo: 'Expected context' };
    var wrong = { foo: 'Wrong context' };
    function fn(){ return this }

    // Specify context via additional argument:
    expect( JSONTransformer.transform({}, {foo: fn}, null, this   ) ).toEqual({foo: this   });
    expect( JSONTransformer.transform({}, {foo: fn}, null, context) ).toEqual({foo: context});

    // Run in function's bound context if has one:
    expect( JSONTransformer.transform({}, {foo: fn.bind(this)   }             ) ).toEqual({foo: this   });
    expect( JSONTransformer.transform({}, {foo: fn.bind(context)}             ) ).toEqual({foo: context});
    expect( JSONTransformer.transform({}, {foo: fn.bind(this)   }, null, wrong) ).toEqual({foo: this   });
    expect( JSONTransformer.transform({}, {foo: fn.bind(context)}, null, wrong) ).toEqual({foo: context});
  });
})
