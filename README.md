kbn-zombie-task-hunter - Kibana zombie task hunter
================================================================================

`kbn-zombie-task-hunter` is a tool to analzye Kibana alerting rules
and their associated tasks to ensure they are consistent.


install
================================================================================

    npm install -g pmuellr/kbn-zombie-task-hunter

or run via

    npx pmuellr/kbn-zombie-task-hunter

Or just copy the script `kbn-zombie-task-hunter.mjs` somewhere, as it
requires no dependencies.
    
usage
================================================================================

    kbn-zombie-task-hunter <es-url>
    
`<es-url>` should be of the form:

- `http(s)://<userid>:<password>@<hostname>:<port>`
- `http(s)://APIKEY:<apikey>@<hostname>:<port>`


change log
================================================================================

#### 0.0.1 - under development

- under development, not yet working


license
================================================================================

This package is licensed under the MIT license.  See the [LICENSE.md][] file
for more information.

contributing
================================================================================

Awesome!  We're happy that you want to contribute.

Please read the [CONTRIBUTING.md][] file for more information.


[LICENSE.md]: LICENSE.md
[CONTRIBUTING.md]: CONTRIBUTING.md
[CHANGELOG.md]: CHANGELOG.md