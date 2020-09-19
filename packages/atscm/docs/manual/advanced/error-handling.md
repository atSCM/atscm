# Guide: Error handling

## Adding source locations

When a throwing an Error that was caused by client code, you should provide location info so it can be traced back to the source code.

To do so, simply add additional properties to the error object, containing the source code, the start location and (optionally) the end location.

```javascript
function myTransformCode() {
  const sourceCode = 'the code transformed';

  try {
    // Do something that may throw an error...
  } catch (error) {
    Object.assign(error, {
      rawLines: sourceCode, // A string containing the raw source code
      location: {
        start: {
          line: 1, // The line number
          column: 1, // The column number
        },
        // you could add a 'end' property here, with the same signature as 'start'
      },
    });

    // Finally re-throw the error
    throw error;
  }
}
```

**Example output: XML Parse error**

```
[13:30:28] Using gulpfile ~/Downloads/delete/atscm-330/node_modules/atscm/out/Gulpfile.js
[13:30:28] Starting 'pull'...
[13:30:30] 'pull' errored after 1.09 s
[13:30:30] closing tag mismatch
  5 |   <atv:gridconfig width="20" gridstyle="lines" enabled="false" height="20"/>
  6 |   <atv:snapconfig width="10" enabled="false" height="10"/>
> 7 |  </metadata>
    |  ^ closing tag mismatch
  8 | </svg>
  9 |
   - Node: AGENT.DISPLAYS.Main
```

**Details**

- [`@babel/code-frame`](https://babeljs.io/docs/en/babel-code-frame) is used to render the frame.
