# The rider's skirt seam (STUCK #1652), Session 2311's attempt

Offline harness: `node wip/ride-skirt/try.mjs` (run from the repo root) reads `dump.json`, one dump of the road rider
`road:ashenmoor|hearthwick:1:1`'s skirt as hbRideSkirt sees it (bind points, triangles, LAP = skinned by the thighs, R = rest on the pelvis,
HANG = S2300's hanging place, the thigh colliders, the saddle grid), and prints, per variant (env ONLY='[{...}]'):
longest edge, ratio to rest, edges over 10 cm, `wide` (the roadfolk check: behind the hips, a side, must be under 0.3), `inThigh>1cm`.
`WHO=1` lists the widest points. `node wip/ride-skirt/off.mjs base` is S2300's placement (0.300 m, 5.6x, wide 0.248).
`skirt.mjs` + `rs.js` are the in-game measure (copy to tests/tmp; ~15 min a boot on software GL).

Found: the tear is the thigh push, not the band. A side point whose rest place is inside the swung thigh near its axis is pushed
straight out from the axis, so two neighbours are thrown to opposite sides (0.11 m one way, 0.10 the other).
Pushing along the side the point's lap place lies on, with the moves smoothed between pushes (js/32-people.js on branch
auto/bodies-2311, commit f9c48703), makes it whole: 0.10 m, 2.8x, 1 edge over 10 cm, 0 into the thighs. But the side hem then follows the
lap's own side move (0.2-0.3 m out, the skinned skirt over a thigh splayed 0.7 rad) and the back reads as a bell: wide 0.37-0.42
(skirt-new0-back.jpg against skirt-main-back.jpg), and roadfolk's S2300 check fails.
Capping the horizontal reach of points under 149 deg to their S2300 hang + 2 cm (cap variant in try.mjs) gives 0.076 m and wide 0.264, but
70 of 386 points end over 1 cm inside the thighs.
Next: the cap, then the lap-side push again, alternated (the push only where the cap leaves a point inside); or the cap's limit from the
thigh's surface at that bearing rather than S2300's hang.
