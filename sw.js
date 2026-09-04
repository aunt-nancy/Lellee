'use strict';
// Compatibility bridge for clients that still register /sw.js.
// The current worker implementation lives in /service-worker.js.
importScripts('/service-worker.js');
