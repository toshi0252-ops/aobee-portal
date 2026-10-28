# Golf v0.31

Show the predicted stopping point and remaining distance for course shots. The distance control also shows estimated run and remaining distance, including on mobile. Flag water landings and shots predicted to roll into water, without depicting them as safe stops.

Use the actual bounce and roll model for the forecast, with a cache invalidated by shot settings and position. Forecasts assume a centered impact; the canvas label and hint tooltip explain this. Ball physics, putts, and save formats are unchanged.

Validation: 60 actual shots across five holes and three trajectories match forecast stopping coordinates (within 0.03m); a separate shot predicted to roll into water incurs the expected penalty. Check prediction purity/cache invalidation, direct water warning, four rendered viewport sizes, and unchanged putt hints. No JavaScript errors. Physical mobile input and human difficulty assessment remain unverified.
