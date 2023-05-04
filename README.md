This is script for Tampermonkey that allows to dump WebGL1 calls as a reproducible code. Functional for now is limited, but for some website it might work.

## Installation

1. Install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)
2. Put URL of a website after "// @match https://www." in the script. For example:

-   [ ] // @match https://www.google.com/*

3. Save script in Tampernonkey
4. Open website in a new tab
5. After website is loaded open DevTools and execute "dump()" in console
6. An html file should be downloaded that is the exact match of all WebGL calls that were made by website
