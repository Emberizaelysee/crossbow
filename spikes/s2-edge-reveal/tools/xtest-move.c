// Moves the pointer (and optionally clicks) on $DISPLAY through XTest.
// Used only to drive S2 inside a nested Xephyr server.
//   xtest-move X Y [click]
#include <X11/Xlib.h>
#include <X11/extensions/XTest.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv) {
  if (argc < 3) { fprintf(stderr, "usage: %s X Y [click]\n", argv[0]); return 2; }
  Display *d = XOpenDisplay(NULL);
  if (!d) { fprintf(stderr, "cannot open display\n"); return 1; }
  XTestFakeMotionEvent(d, -1, atoi(argv[1]), atoi(argv[2]), CurrentTime);
  if (argc > 3 && strcmp(argv[3], "click") == 0) {
    XTestFakeButtonEvent(d, 1, True, CurrentTime);
    XTestFakeButtonEvent(d, 1, False, CurrentTime);
  }
  XFlush(d);
  XCloseDisplay(d);
  return 0;
}
