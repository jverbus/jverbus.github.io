---
layout: post
title: "Calibrating the LUX Dark Matter Experiment"
description: "Ph.D. thesis work: an absolute, in situ calibration of sub-keV nuclear recoils in the LUX dark matter detector using D-D neutron scattering kinematics."
last_modified_at: 2026-06-11
og_image: "/assets/images/social/2016-08-18-calibrating-the-lux-dark-matter-experiment-1200x630.jpg"
og_image_alt: "Calibrating the LUX Dark Matter Experiment"
og_image_width: 1200
og_image_height: 630
categories: ["Ph.D. Thesis"]
tags: [physics, astrophysics, dark matter, D-D neutron generator, Brown University, LUX, LZ]
---

Dark matter constitutes about 85% of the matter in the universe, yet it has never been directly observed. The [Large Underground Xenon (LUX)](https://lux.brown.edu/LUX_dark_matter/Home.html) experiment searched for it with a dual-phase liquid xenon time projection chamber (TPC) containing 370 kg of xenon, 250 kg of it active, operated on the 4850-foot level at the Sanford Underground Research Facility in Lead, South Dakota. At the time of this work, LUX held the most stringent limits over most of the WIMP mass range on Weakly Interacting Massive Particles (WIMPs), a leading class of dark matter candidates.

A WIMP would reveal itself as a nuclear recoil, with an expected energy spectrum that rises steeply toward the detection threshold; for the low-mass WIMPs most contested at the time, the relevant recoils lie at a few keV and below. The credibility of any claimed dark matter sensitivity therefore rests on a demonstration that the detector produces measurable signals from nuclear recoils at these energies, with an energy scale that can be defended. For my [Ph.D. thesis](https://repository.library.brown.edu/studio/item/bdr:674209/), I led the experimental design, operations, and analysis of a new calibration that provided that demonstration: an absolute, in situ measurement of how liquid xenon responds to low-energy nuclear recoils, performed inside the LUX detector itself.

![Neutron generator outside of the LUX water tank]({{ '/assets/images/jverbus_neutron_generator_outside_lux.jpg' | relative_url }}){: width="504" height="672" }

*With the deuterium-deuterium (D-D) neutron generator used for the calibration, outside the LUX water shield.*

## An Energy Scale Set by Scattering Kinematics

Nuclear recoil calibrations of liquid xenon detectors had typically inferred the energy scale by comparing observed spectra against simulation, or by transferring measurements made in smaller external test setups. Both approaches accumulate systematic uncertainty precisely where the dark matter question is most delicate: at the lowest recoil energies.

The technique developed in this thesis removes simulation from the energy scale. A collimated beam of 2.45 MeV mono-energetic neutrons from D-D fusion is directed into the active xenon volume. When a single neutron scatters twice inside the TPC, the reconstructed positions of the two interaction vertices determine the scattering angle of the first interaction, and non-relativistic scattering kinematics convert that angle into the recoil energy deposited there; to good approximation, the recoil energy is proportional to one minus the cosine of the scattering angle. The energy scale is therefore anchored in kinematics, independent of both simulation and the xenon signal model under calibration.

<img src="{{ '/assets/images/lux-dd-technique-schematic.png' | relative_url }}" alt="Schematic of a dual-phase time projection chamber with a collimated mono-energetic neutron beam scattering twice in the liquid target, defining a scattering angle" width="1366" height="954" loading="lazy" decoding="async">

*A mono-energetic neutron scattering twice within a dual-phase TPC. The reconstructed vertex positions define the scattering angle, which sets the energy of the first recoil. (Figure from my Ph.D. thesis.)*

## A Neutron Beam Through the Water Shield

The neutron source was an Adelphi Technology DD108 generator. Before deployment, its output was characterized with a time-of-flight measurement at Brown University, confirming a quasi-mono-energetic spectrum at the nominal 2.45 MeV and suitable for the calibration.

At SURF, the generator was positioned outside the water tank shielding LUX, 8 m in diameter, and neutrons were delivered through an air-filled conduit that crosses the water to the detector cryostat, defining a collimated beam through the active xenon volume. The conduit was installed and aligned with the detector before the tank was filled.

<img src="{{ '/assets/images/lux-water-tank-conduit.jpg' | relative_url }}" alt="Interior of the empty LUX water tank with the titanium cryostat suspended at center and the neutron conduit hanging horizontally at right" width="970" height="646" loading="lazy" decoding="async">

*The interior of the LUX water tank before filling. The titanium cryostat hangs at center; the neutron conduit is suspended at right, in line with the future beam path. (Photograph courtesy of the Sanford Underground Research Facility; from my dissertation defense slides.)*

<img src="{{ '/assets/images/lux-dd-setup-diagram.jpg' | relative_url }}" alt="Conceptual diagram of the LUX D-D calibration: neutrons travel through a conduit across the water tank into the TPC, where a double scatter is reconstructed from PMT hit patterns and drift times" width="1310" height="1259" loading="lazy" decoding="async">

*The calibration configuration. Neutrons enter through a conduit spanning the water shield; for double-scatter events, the photomultiplier hit patterns provide the transverse vertex positions and the drift times provide depth, together determining the scattering angle. (Figure from my Ph.D. thesis.)*

The beam is directly visible in the calibration data. Plotting single-scatter event positions recorded during generator operation reveals a horizontal band of interactions crossing the xenon volume, with a bright region of scattering shine where the beam enters. This provided a direct, data-driven confirmation of the beam geometry and alignment.

<img src="{{ '/assets/images/lux-dd-neutron-beam-data.jpg' | relative_url }}" alt="Distribution of single-scatter events in drift time versus position along the beam direction, showing a horizontal band of neutron interactions crossing the detector" width="1665" height="983" loading="lazy" decoding="async">

*The neutron beam imaged in LUX data: single-scatter event positions in drift time versus the coordinate along the beam direction. The horizontal band is the beam crossing the xenon; the bright region at its entry point is shine from neutrons scattering in passive detector materials. (Figure from my Ph.D. thesis.)*

## Signal Yields Measured Below 1 keV

The ionization yield was measured from double-scatter events for recoils of 0.7 to 24 keV, and the scintillation yield from single-scatter data at the lowest energies, with its energy scale anchored by the measured charge yield. A complementary analysis at the kinematically fixed 74 keV endpoint of the recoil spectrum extended both yields to that energy, for full spans of 0.7 to 74 keV (charge) and 1.1 to 74 keV (light) at an average drift field of 180 V/cm. These results reach a factor of five (charge) and a factor of three (light) lower in energy than any previous measurement with a scattering-angle-derived energy scale, and constitute the first light yield for liquid xenon reported directly in absolute units of photons per keV.

Over a factor of one hundred in recoil energy, the measured yields are consistent with the Lindhard description of energy partition in nuclear recoils, and they constrain proposed kinematic cutoffs in signal production at low energy. Most consequentially for the dark matter program, the measurements demonstrate that liquid xenon produces measurable ionization and scintillation at recoil energies of order 1 keV.

<img src="{{ '/assets/images/lux-dd-yield-results.png' | relative_url }}" alt="Measured charge and light yields for nuclear recoils in LUX as a function of recoil energy with Lindhard model fits, and the corresponding detection efficiencies" width="1384" height="1466" loading="lazy" decoding="async">

*Measured charge (top) and light (middle) yields for nuclear recoils in LUX, with Lindhard-model fits, and the corresponding detection efficiencies (bottom). (Figure reproduced in my Ph.D. thesis from the LUX Collaboration result, Phys. Rev. Lett. 116, 161301 (2016).)*

## Impact on the WIMP Search

These yields fed directly into the 2016 reanalysis of the LUX WIMP search exposure. With the low-energy response established by calibration rather than extrapolation, the sensitivity of the experiment to a 7 GeV/c² WIMP improved by a factor of seven, sharpening the disagreement between the LUX results and claims of low-mass WIMP signals reported by other experiments. The calibrated response also provides a foundation for computing the expected rate of coherent elastic neutrino-nucleus scattering from solar ⁸B neutrinos, whose maximum recoil energy of 3.7 keV falls within the newly calibrated range.

<img src="{{ '/assets/images/lux-wimp-limits-2016.png' | relative_url }}" alt="Upper limits on the spin-independent WIMP-nucleon cross section versus WIMP mass, comparing the 2016 LUX result against the 2014 result and contemporaneous experiments" width="1385" height="952" loading="lazy" decoding="async">

*Ninety percent confidence upper limits on the spin-independent WIMP-nucleon cross section: the 2016 LUX reanalysis incorporating this calibration (black), the 2014 LUX result (gray), and contemporaneous experiments. (Figure reproduced in my Ph.D. thesis from the LUX Collaboration result, Phys. Rev. Lett. 116, 161301 (2016).)*

## A Core Technique for LZ

The technique outlived the experiment it was built for. D-D calibration was adopted as a central element of the LZ calibration program, the 10-tonne successor to LUX constructed within the same water shield, and I served as the L3 manager for the D-D calibration program during LZ's early design phase. The thesis also charted a path to recoil energies almost ten times lower through a proposed 272 keV quasi-mono-energetic neutron source, produced by reflecting D-D neutrons from deuterium, for which forward scatters in xenon deposit recoil energies of at most a few keV.

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
