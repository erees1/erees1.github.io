#! /usr/bin/env node

/*************************************************************************
 *
 *  direct/tex2svg-page
 *
 *  Uses MathJax v3 to convert all TeX in an HTML document.
 *
 * ----------------------------------------------------------------------
 *
 *  Copyright (c) 2018 The MathJax Consortium
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

//
//  Load the packages needed for MathJax
//
const { mathjax } = require("mathjax-full/js/mathjax.js");
const { TeX } = require("mathjax-full/js/input/tex.js");
const { SVG } = require("mathjax-full/js/output/svg.js");
const { liteAdaptor } = require("mathjax-full/js/adaptors/liteAdaptor.js");
const { RegisterHTMLHandler } = require("mathjax-full/js/handlers/html.js");
const {
  AssistiveMmlHandler,
} = require("mathjax-full/js/a11y/assistive-mml.js");

const { AllPackages } = require("mathjax-full/js/input/tex/AllPackages.js");

require("mathjax-full/js/util/entities/all.js");

//
//  Get the command-line arguments
//
var argv = require("yargs")
  .demand(1)
  .strict()
  .usage("$0 [options] file.html > converted.html")
  .options({
    em: {
      default: 17,
      describe: "em-size in pixels",
    },
    ex: {
      default: 8,
      describe: "ex-size in pixels",
    },
    packages: {
      default: AllPackages.sort().join(", "),
      describe: 'the packages to use, e.g. "base, ams"',
    },
    fontCache: {
      default: "global",
      describe: "cache type: local, global, none",
    },
  }).argv;

//
//  Read the HTML file
//
const htmlfile = require("fs").readFileSync(argv._[0], "utf8");
//
//  Create DOM adaptor and register it for HTML documents
//
const adaptor = liteAdaptor();
const handler = RegisterHTMLHandler(adaptor);
if (argv.assistiveMml) AssistiveMmlHandler(handler);

//
//  Create input and output jax and a document using them on the content from the HTML file
//
const tex = new TeX({
  packages: argv.packages.split(/\s*,\s*/),
  inlineMath: [
    ["$", "$"],
    ["\\(", "\\)"],
  ],
});
const svg = new SVG({ fontCache: argv.fontCache, exFactor: argv.ex / argv.em });
const html = mathjax.document(htmlfile, { InputJax: tex, OutputJax: svg });

//
//  Typeset the document
//
html.render();

//
//  If no math was found on the page, remove the stylesheet and font cache (if any)
//
if (Array.from(html.math).length === 0) {
  adaptor.remove(html.outputJax.svgStyles);
  const cache = adaptor.elementById(
    adaptor.body(html.document),
    "MJX-SVG-global-cache"
  );
  if (cache) adaptor.remove(cache);
}

//
//  Output the resulting HTML
//
console.log(adaptor.doctype(html.document));
console.log(adaptor.outerHTML(adaptor.root(html.document)));
