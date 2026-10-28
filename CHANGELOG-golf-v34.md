# Golf v0.34

Slow the power gauge near a weak shot's selected distance, making short approaches practical. For a 3m SW target, the first target crossing takes approximately 0.77s rather than 0.07s. Accelerate outside that region so the full power range and return remain available. Drive power, PT power, impact timing, and ball physics are unchanged.

Expand the weak-shot portion of the meter without changing the actual power used by the shot. The needle and target mark share a continuous, monotonic mapping. Show short approach power as distance in meters, including tenths, and expose the current and target distance to assistive technology.

Validation: 120/60/30Hz simulated updates, 3m and 10m SW/PW approaches, unchanged drive/PT/impact, 50ms timing offset at 3m produces 0.195m power-distance difference, meter bounds and ordering, full sweep return, pause, four rendered viewport sizes, and native three-press input selecting 2.99m before a real settled shot. No browser JavaScript errors. Physical mobile timing and human difficulty assessment remain unverified.
