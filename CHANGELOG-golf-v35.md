# Golf v0.35

Frame putting around the ball and cup instead of always displaying the full green. Fit the view to the available portrait or landscape play area, keeping short putts much larger. At 3m, 390px portrait is about 4x the previous scale and 640px landscape is about 6x. Close views use a 1m grid; wider views retain 5m spacing.

Use the same camera for the green, guide, mascot, contact cue, and inverse screen-to-ground targeting. Capture the projection during a drag and keep the view anchored during the putt and cup sink. Move the flow/distance/grid caption below the ball, away from the upper controls.

Validation: five rendered viewport sizes; screen/world coordinate inversion and real screen taps; twelve actual putts across three holes and four distances produce identical ball position, strokes, and cup state to v0.34; stable camera through a 3m cup-in. No browser JavaScript errors. Physics and save formats are unchanged. Physical mobile input and human difficulty remain unverified.
