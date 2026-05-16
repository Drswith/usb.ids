## Design

The CLI fetch path already writes `packages/cli/usb.ids.json` and `packages/cli/usb.ids.version.json` through the SDK repository helpers. The smallest durable fix is to normalize those helpers so JSON persistence always appends a trailing newline.

This keeps formatting policy in one place:

- the CLI fetch command benefits automatically because it already delegates to the SDK helpers
- tests can assert the newline contract directly at the helper boundary
- current generated artifacts can be reformatted once and future releases will stay consistent
