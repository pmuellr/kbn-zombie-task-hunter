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

The script will generate some diagnostic information, and include some
Dev Tools commands that can be used to resolve some issues.

These changes may include changing the `.kibana_task_manager` index,
which requires the `kibana_system` role for elastic stack versions > 9.
You should create a user with this role just to run these Dev Tools
commands, and then delete the user when finished resolving issues.


creating zombie alerting tasks to test with
================================================================================

1. create a rule
2. export it via the Saved Objects page
3. import it via the Saved Objects page, using options "Check for existing
   objects" / "Automatically overwrite conflicts"
4. the overwritten rules are disabled and have no task id assigned, however
   the task objects are still being run.


change log
================================================================================

#### 2025-07-15 - 1.0.2 - specify precise index names

- fixed to use narrower index patterns for searches

#### 2025-07-14 - 1.0.1 - fix broken task ids

- task id's generated for the Dev Tools bulk delete were incorrect

#### 2025-07-13 - 1.0.0 - initial release

- seems to work with a basic manual test


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