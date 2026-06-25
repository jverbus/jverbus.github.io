---
layout: post
title: "Calibrating the LUX Dark Matter Experiment"
description: "Ph.D. thesis work: an absolute, in situ calibration of low-energy nuclear recoils in LUX, using D-D neutron scattering kinematics to measure liquid xenon charge and light yields near threshold."
last_modified_at: 2026-06-25
og_image: "/assets/images/social/2016-08-18-calibrating-the-lux-dark-matter-experiment-1200x630.jpg"
og_image_alt: "Calibrating the LUX Dark Matter Experiment"
og_image_width: 1200
og_image_height: 630
categories: ["Ph.D. Thesis"]
tags: [Physics, astrophysics, dark matter, D-D neutron generator, Brown University, LUX, LZ]
related:
  - /2025/02/10/brown-physics-ai-winter-school-workshop/
---

Dark matter constitutes about 85% of the matter in the universe, yet it has never been directly observed. The [Large Underground Xenon (LUX)](https://lux.brown.edu/LUX_dark_matter/Home.html) experiment searched for it with a dual-phase liquid xenon time projection chamber (TPC) containing 370 kg of xenon, 250 kg of it active, operated on the 4850-foot level at the Sanford Underground Research Facility in Lead, South Dakota. At the time of this work, LUX set the strongest limits over most of the WIMP mass range on Weakly Interacting Massive Particles (WIMPs), a leading class of dark matter candidates.

A WIMP would reveal itself as a nuclear recoil: a xenon nucleus kicked by an incoming particle. In LUX, that recoil produces prompt scintillation light (S1) and delayed ionization charge (S2). Turning those signals into a WIMP sensitivity curve requires a signal model for how many photons and electrons liquid xenon produces per keV of recoil energy, especially near threshold where low-mass WIMP spectra are steepest.

For my [Ph.D. thesis](https://repository.library.brown.edu/studio/item/bdr:674209/), I led the experimental design, underground operations, and analysis for an absolute, in situ calibration of that signal model. The central point was to measure low-energy nuclear recoils inside LUX itself, at the detector's operating field and geometry, with an energy scale set by neutron scattering kinematics rather than by extrapolating from external measurements.

![Neutron generator outside of the LUX water tank]({{ '/assets/images/jverbus_neutron_generator_outside_lux.jpg' | relative_url }}){: width="504" height="672" }

*With the deuterium-deuterium (D-D) neutron generator used for the calibration, outside the LUX water shield.*

## What Had to Be Calibrated

The calibration target was not "can LUX see neutrons?" LUX already had neutron calibration data. The harder question was whether the detector response could be measured at the recoil energies that matter most for low-mass dark matter searches, where the available S1 and S2 signals are small and model assumptions dominate the interpretation.

Two response functions matter:

- the ionization yield, Qy, measured in extracted electrons per keV of nuclear recoil energy
- the scintillation yield, Ly, measured in produced photons per keV of nuclear recoil energy

Those quantities define the mapping from nuclear recoil energy to the observed S1 and S2 distributions. A low-energy WIMP limit is only as convincing as that mapping.

## Geometry as the Energy Scale

Nuclear recoil calibrations of liquid xenon detectors had typically inferred the energy scale by comparing observed spectra against simulation, or by transferring measurements made in smaller external test setups. Both approaches accumulate systematic uncertainty precisely where the dark matter question is most delicate: at the lowest recoil energies.

The technique developed in this thesis does not use simulation to assign recoil energy to a double-scatter event. A collimated beam of quasi-monoenergetic 2.45 MeV neutrons from D-D fusion enters the active xenon volume. When one neutron scatters twice inside the TPC, the reconstructed positions of the two interaction vertices determine the outgoing neutron direction after the first scatter. Combined with the known incoming beam direction, that gives the lab scattering angle.

The recoil energy then follows from non-relativistic two-body elastic scattering. The endpoint is fixed by the mass ratio alone:

`E_r,max = E_n * 4 m_n M_Xe / (m_n + M_Xe)^2`

For 2.45 MeV neutrons on xenon, that endpoint is about 74 keV. Smaller lab scattering angles map to lower recoil energies; a 1 keV xenon recoil corresponds to a scattering angle of roughly 13 degrees. That is why this was a geometry problem as much as a detector-response problem: centimeter-scale vertex reconstruction sets the recoil-energy resolution near threshold.

The important separation is that simulation was still used where it belongs, for acceptance, backgrounds, and response modeling. It was not the source of the double-scatter nuclear recoil energy scale.

<img src="{{ '/assets/images/lux-dd-technique-schematic.png' | relative_url }}" alt="Schematic of a dual-phase time projection chamber with a collimated mono-energetic neutron beam scattering twice in the liquid target, defining a scattering angle" width="1366" height="954" loading="lazy" decoding="async">

*A mono-energetic neutron scattering twice within a dual-phase TPC. The reconstructed vertex positions define the scattering angle, which sets the energy of the first recoil. (Figure from my Ph.D. thesis.)*

{% include site/lux-demo.html %}

## Why Double and Single Scatters Both Matter

Double-scatter events provide the cleanest energy tag. The two S2 pulses are separated in drift time when the vertices have different depths, so the ionization signal from the first vertex can be measured against a kinematically reconstructed recoil energy. That gives the low-energy Qy measurement directly.

The light channel is more difficult. In liquid xenon, the prompt scintillation pulses from two neutron scatters typically overlap in time, so the S1 contribution from each vertex is not cleanly separated event by event. The low-energy Ly analysis therefore used single-scatter events in the beam, with the energy scale constrained by the measured charge yield and response model. A complementary endpoint analysis used the sharp 74 keV maximum recoil feature in single-scatter S1 and S2 spectra to extend both Ly and Qy to the top of the D-D recoil range.

That division matches the experimental constraints: use double scatters where geometry gives event-level energies, use single scatters where the data provide higher-statistics spectra, and tie the two together with the measured charge response and the kinematic endpoint.

## A Neutron Beam Through the Water Shield

The neutron source was an Adelphi Technology DD108 generator. Before deployment, its output was characterized with a time-of-flight measurement at Brown University, confirming a quasi-monoenergetic spectrum near 2.45 MeV. In the selected beam sample, the relevant neutron energies were within roughly 6% of the source energy, suitable for the scattering-angle energy reconstruction.

At SURF, the generator was positioned outside the water tank shielding LUX, 8 m in diameter, and neutrons were delivered through an air-filled conduit that crosses the water to the detector cryostat, defining a collimated beam through the active xenon volume. The conduit was installed and aligned with the detector before the tank was filled.

<img src="{{ '/assets/images/lux-water-tank-conduit.jpg' | relative_url }}" alt="Interior of the empty LUX water tank with the titanium cryostat suspended at center and the neutron conduit hanging horizontally at right" width="970" height="646" loading="lazy" decoding="async">

*The interior of the LUX water tank before filling. The titanium cryostat hangs at center; the neutron conduit is suspended at right, in line with the future beam path. (Photograph courtesy of the Sanford Underground Research Facility; from my dissertation defense slides.)*

<img src="{{ '/assets/images/lux-dd-setup-diagram.jpg' | relative_url }}" alt="Conceptual diagram of the LUX D-D calibration: neutrons travel through a conduit across the water tank into the TPC, where a double scatter is reconstructed from PMT hit patterns and drift times" width="1310" height="1259" loading="lazy" decoding="async">

*The calibration configuration. Neutrons enter through a conduit spanning the water shield; for double-scatter events, the photomultiplier hit patterns provide the transverse vertex positions and the drift times provide depth, together determining the scattering angle. (Figure from my Ph.D. thesis.)*

The beam is directly visible in the calibration data. Plotting single-scatter event positions recorded during generator operation reveals a horizontal band of interactions crossing the xenon volume, with a bright region of scattering shine where the beam enters. This provided a direct, data-driven confirmation of the beam geometry and alignment.

<img src="{{ '/assets/images/lux-dd-neutron-beam-data.jpg' | relative_url }}" alt="Distribution of single-scatter events in drift time versus position along the beam direction, showing a horizontal band of neutron interactions crossing the detector" width="1665" height="983" loading="lazy" decoding="async">

*The neutron beam imaged in LUX data: single-scatter event positions in drift time versus the coordinate along the beam direction. The horizontal band is the beam crossing the xenon; the bright region at its entry point is shine from neutrons scattering in passive detector materials. (Figure from my Ph.D. thesis.)*

## Signal Yields Measured Below 1 keV

The ionization yield was measured from double-scatter events for recoils of 0.7 to 24 keV. The scintillation yield was measured from single-scatter data at low energies, with its energy scale anchored by the charge-yield measurement. A complementary endpoint analysis extended both channels to the kinematically fixed 74 keV maximum recoil energy.

The final calibrated spans were 0.7 to 74 keV for charge and 1.1 to 74 keV for light, at LUX's average drift field of 180 V/cm. The charge result reached a factor of five lower in energy than prior scattering-angle-derived measurements, and the light result reached a factor of three lower. At the 74 keV endpoint, the measured yields were about 3.06 electrons/keV and 14.0 photons/keV.

Over roughly two orders of magnitude in recoil energy, the measured yields were consistent with a Lindhard-based description of energy partition in nuclear recoils. More importantly for the dark matter search, the data showed measurable ionization and scintillation at recoil energies of order 1 keV, directly in the detector that produced the WIMP result.

<img src="{{ '/assets/images/lux-dd-yield-results.png' | relative_url }}" alt="Measured charge and light yields for nuclear recoils in LUX as a function of recoil energy with Lindhard model fits, and the corresponding detection efficiencies" width="1384" height="1466" loading="lazy" decoding="async">

*Measured charge (top) and light (middle) yields for nuclear recoils in LUX, with Lindhard-model fits, and the corresponding detection efficiencies (bottom). (Figure reproduced in my Ph.D. thesis from the LUX Collaboration result, Phys. Rev. Lett. 116, 161301 (2016).)*

## Impact on the WIMP Search

These yields fed directly into the 2016 reanalysis of the LUX WIMP search exposure through a Lindhard-based NEST signal model fit to the D-D calibration data. With the low-energy response established by calibration rather than extrapolation, the sensitivity of the experiment to a 7 GeV/c^2 WIMP improved by a factor of seven, sharpening the disagreement between the LUX results and claims of low-mass WIMP signals reported by other experiments.

The same calibration also matters for coherent elastic neutrino-nucleus scattering from solar boron-8 neutrinos. The maximum recoil energy from that source in xenon is about 3.7 keV, so the relevant signal region sits inside the energy range that the D-D calibration constrained.

<img src="{{ '/assets/images/lux-wimp-limits-2016.png' | relative_url }}" alt="Upper limits on the spin-independent WIMP-nucleon cross section versus WIMP mass, comparing the 2016 LUX result against the 2014 result and contemporaneous experiments" width="1385" height="952" loading="lazy" decoding="async">

*Ninety percent confidence upper limits on the spin-independent WIMP-nucleon cross section: the 2016 LUX reanalysis incorporating this calibration (black), the 2014 LUX result (gray), and contemporaneous experiments. (Figure reproduced in my Ph.D. thesis from the LUX Collaboration result, Phys. Rev. Lett. 116, 161301 (2016).)*

## Carried into LZ

The technique outlived the experiment it was built for. D-D calibration became a central element of the LZ calibration program, the 10-tonne successor to LUX constructed within the same water shield, and I served as the L3 manager for the D-D calibration program during LZ's early design phase.

The thesis also laid out the next technical step: a quasi-monoenergetic 272 keV neutron source produced by reflecting D-D neutrons from deuterium. The lower source energy gives an 8 keV recoil endpoint in xenon and improves the angle lever arm at threshold. A 1 keV recoil from a 272 keV neutron corresponds to about 41 degrees instead of about 13 degrees for a 2.45 MeV neutron, reducing the fractional impact of vertex-position uncertainty on the reconstructed energy.

<img src="{{ '/assets/images/lz-detector-cutout.jpg' | relative_url }}" alt="Cutout view of the LZ detector solid model inside the water tank, with the two D-D neutron calibration conduits visible" width="1534" height="969" loading="lazy" decoding="async">

*The LZ detector within the former LUX water shield; the two D-D calibration conduits are visible in yellow. (Solid model by Matt Hoff, LZ Collaboration; figure from my Ph.D. thesis.)*

## Resources

### Thesis

- [Ph.D. thesis (Brown Digital Repository)](https://repository.library.brown.edu/studio/item/bdr:674209/)
- [Dissertation defense slides]({{ '/assets/files/20160510_jverbus_thesis_defense_v4_public.pdf' | relative_url }})

### Papers

- [Low-energy (0.7-74 keV) nuclear recoil calibration of the LUX dark matter experiment using D-D neutron scattering kinematics](https://arxiv.org/abs/1608.05381)
- [Proposed low-energy absolute calibration of nuclear recoils in a dual-phase noble element TPC using D-D neutron scattering kinematics](https://arxiv.org/abs/1608.05309)

### News coverage

- [phys.org: LUX dark matter results confirmed](https://phys.org/news/2014-02-lux-dark-results.html)
- [redOrbit: Dark matter results confirmed, no evidence of WIMPs yet](https://www.redorbit.com/news/space/1113077219/dark-matter-results-confirmed-no-evidence-of-wimps-yet-022114/)
- [Brown Daily Herald: Research moves toward detection of dark matter particles](https://www.browndailyherald.com/2014/03/05/research-moves-toward-detection-dark-matter-particles/)
- [Adelphi Technology: The search for dark matter](https://www.adelphitech.com/search-for-dark-matter.html)
- [Mitchell Republic: Dark matter lab moves underground in South Dakota](https://www.mitchellrepublic.com/content/dark-matter-lab-moves-underground-south-dakota)
