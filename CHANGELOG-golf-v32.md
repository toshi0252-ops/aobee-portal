# Golf v0.32

Replace the trajectory cycling button with a three-option comparison dialog. For the current club, aim, and target distance, compare standard, low, and high shots by carry capacity, run, remaining distance, and water risk before choosing. Trajectory diagrams and selected state make the options visible on mobile and desktop.

Opening the dialog preserves the shot and pauses simulation and background inputs. Cancel or Escape returns unchanged; choosing preserves the aim and club, clamps the target only if it exceeds the selected trajectory's capacity, and saves the choice. Forecasts assume centered impact and use the same landing and ground model as the game.

Validation: 54 pure comparison forecasts match live shot previews; modal pause, input locks, cancel/Escape and focus, selection/save/clamp, water risk, PT/power/flight guards, and a real shot settling. Five rendered viewport sizes show all three options. No browser JavaScript errors. Human difficulty and physical mobile input remain unverified.
