---
layout: post
title: "Calibrating the LUX Dark Matter Experiment"
description: "Measuring the charge and light response of liquid xenon to low-energy nuclear recoils using D-D neutron scattering in LUX."
last_modified_at: 2026-09-19
og_image: "/assets/images/social/2016-08-18-calibrating-the-lux-dark-matter-experiment-1200x630.jpg"
og_image_alt: "Calibrating the LUX Dark Matter Experiment"
og_image_width: 1200
og_image_height: 630
categories: ["Ph.D. Thesis"]
tags: [Physics, astrophysics, dark matter, D-D neutron generator, Brown University, LUX, LZ]
related:
  - /2025/02/10/brown-physics-ai-winter-school-workshop/
---

For my [Ph.D. thesis](https://repository.library.brown.edu/studio/item/bdr:674209/), I led the LUX D-D nuclear recoil calibration program, including the experimental design, underground operations, and analysis. We measured the charge and light yields in the detector itself, using neutron scattering kinematics to determine the recoil-energy scale.

Dark matter constitutes about 85% of the matter in the universe. The [Large Underground Xenon (LUX)](https://lux.brown.edu/LUX_dark_matter/Home.html) experiment searched for Weakly Interacting Massive Particles (WIMPs) using a dual-phase liquid xenon time projection chamber (TPC). The detector contained 370 kg of xenon, including a 250 kg active volume, and operated at the 4850-foot level of the Sanford Underground Research Facility in Lead, South Dakota. At the time of this work, LUX had set the strongest exclusion limits over most of the WIMP mass range.

A WIMP interaction would produce a recoiling xenon nucleus. The recoil produces prompt scintillation light (S1) and ionization electrons. The electrons drift to the liquid surface, are extracted into the gas, and produce secondary scintillation (S2). Predicting the detector response requires measurements of the photons and electrons produced per keV of recoil energy, particularly near the detection threshold.

![Neutron generator outside of the LUX water tank]({{ '/assets/images/jverbus_neutron_generator_outside_lux.jpg' | relative_url }}){: width="504" height="672" }

*With the deuterium-deuterium (D-D) neutron generator used for the calibration, outside the LUX water shield.*

## Charge and light yields
{: #what-had-to-be-calibrated }

The low-mass WIMP sensitivity depended strongly on the detector response near threshold, where the expected S1 and S2 signals are small.

We measured two response functions:

- The ionization yield, Qy, in electrons escaping recombination per keV of nuclear recoil energy.
- The scintillation yield, Ly, in photons produced per keV of nuclear recoil energy.

These yields determine the predicted S1 and S2 distributions for a given nuclear recoil energy, and their uncertainties propagate into the detector-response model.

## Reconstructing recoil energy from scattering geometry
{: #geometry-as-the-energy-scale }

Earlier nuclear recoil calibrations inferred the energy scale by fitting simulated spectra to data, or used measurements from smaller external detectors. The first approach depends on modeling the neutron spectrum and scattering in passive material; the second requires transferring the measured response to the dark matter detector.

A collimated beam of quasi-monoenergetic 2.45 MeV neutrons from D-D fusion enters the active xenon volume. For a neutron that scatters twice, the reconstructed interaction positions determine its direction after the first scatter. The angle between that direction and the incident beam gives the laboratory scattering angle and hence the energy transferred to the first xenon nucleus.

The recoil energy then follows from non-relativistic two-body elastic scattering. For a fixed incident neutron energy, the endpoint is set by the xenon and neutron masses:

`E_r,max = E_n * 4 m_n M_Xe / (m_n + M_Xe)^2`

For 2.45 MeV neutrons on xenon, the maximum recoil energy is about 74 keV. A 1 keV recoil corresponds to a laboratory scattering angle of roughly 13 degrees. At these small angles, centimeter-scale uncertainties in the interaction positions limit the recoil-energy resolution.

We used simulation to estimate acceptance, backgrounds, and detector response, and to correct the mean recoil energy in each charge-yield analysis bin for position-reconstruction bias ([thesis §5.2](https://repository.library.brown.edu/studio/item/bdr:674209/)).

<img src="{{ '/assets/images/lux-dd-technique-schematic.png' | relative_url }}" alt="Schematic of a dual-phase time projection chamber with a collimated mono-energetic neutron beam scattering twice in the liquid target, defining a scattering angle" width="1366" height="954" loading="lazy" decoding="async">

*A mono-energetic neutron scattering twice within a dual-phase TPC. The reconstructed vertex positions define the scattering angle, which sets the energy of the first recoil. (Figure from my Ph.D. thesis.)*

{% include site/lux-demo.html %}

## Double- and single-scatter measurements
{: #why-double-and-single-scatters-both-matter }

For double-scatter events with sufficient separation in depth, the two S2 pulses are resolved in drift time. The ionization signal from the first vertex can then be paired with its kinematically reconstructed energy to measure Qy.

The S1 pulses from the two interactions usually overlap, so the light yield was measured using single-scatter events. Their energy scale was constrained by the measured charge yield and detector-response model. A separate endpoint analysis used the 74 keV cutoff in the single-scatter S1 and S2 spectra to measure Ly and Qy at the maximum recoil energy.

## A Neutron Beam Through the Water Shield

We characterized the Adelphi Technology DD108 neutron generator at Brown using a time-of-flight measurement, which confirmed a quasi-monoenergetic spectrum near 2.45 MeV. Monte Carlo neutron-transport studies showed that, after fiducial-volume cuts along the beam projection, [95% of accepted events were produced by neutrons within 6% of their energy at the source](https://arxiv.org/pdf/1608.05309#page=4).

At SURF, the generator was positioned outside the 8 m-diameter water tank shielding LUX. An air-filled conduit through the water provided a collimated neutron path to the detector cryostat. The conduit was installed and aligned before the tank was filled.

<img src="{{ '/assets/images/lux-water-tank-conduit.jpg' | relative_url }}" alt="Interior of the empty LUX water tank with the titanium cryostat suspended at center and the neutron conduit hanging horizontally at right" width="970" height="646" loading="lazy" decoding="async">

*The interior of the LUX water tank before filling. The titanium cryostat hangs at center. The neutron conduit is suspended at lower right, out of line with the detector for WIMP-search operation. (Photograph courtesy of the Sanford Underground Research Facility; from my dissertation defense slides.)*

<img src="{{ '/assets/images/lux-dd-setup-diagram.jpg' | relative_url }}" alt="Conceptual diagram of the LUX D-D calibration: neutrons travel through a conduit across the water tank into the TPC, where a double scatter is reconstructed from PMT hit patterns and drift times" width="1310" height="1259" loading="lazy" decoding="async">

*The calibration configuration. Neutrons enter through a conduit spanning the water shield; for double-scatter events, the photomultiplier hit patterns provide the transverse vertex positions and the drift times provide depth, together determining the scattering angle. (Figure from my Ph.D. thesis.)*

The single-scatter event positions show the neutron beam as a horizontal band crossing the xenon volume. Scattering in passive detector material produces the brighter region near the beam entrance. These data confirmed the beam position and alignment.

<img src="{{ '/assets/images/lux-dd-neutron-beam-data.jpg' | relative_url }}" alt="Distribution of single-scatter events in drift time versus position along the beam direction, showing a horizontal band of neutron interactions crossing the detector" width="1665" height="983" loading="lazy" decoding="async">

*The neutron beam imaged in LUX data: single-scatter event positions in drift time versus the coordinate along the beam direction. The horizontal band is the beam crossing the xenon; the bright region at its entry point is shine from neutrons scattering in passive detector materials. (Figure from my Ph.D. thesis.)*

## Charge and light yields near threshold
{: #signal-yields-measured-below-1-kev }

At LUX’s average drift field of 180 V/cm, the charge-yield measurements covered 0.7 to 24 keV, with an additional measurement at 74 keV. The light-yield measurements spanned 1.1 to 74 keV. The lowest measured charge and light energies were lower by factors of five and three, respectively, than previous scattering-angle measurements.

At 74 keV, the yields were approximately 3.06 electrons/keV and 14.0 photons/keV. The statistical and systematic uncertainties are reported in the [calibration paper](https://arxiv.org/pdf/1608.05381#page=17), Sections V.A–B and Tables V–VI; Tables I and III contain the low-energy results.

The measured yields were consistent with a Lindhard-based description of energy partition over roughly two orders of magnitude in recoil energy.

<img src="{{ '/assets/images/lux-dd-yield-results.png' | relative_url }}" alt="Measured charge and light yields for nuclear recoils in LUX as a function of recoil energy with Lindhard model fits, and the corresponding detection efficiencies" width="1384" height="1466" loading="lazy" decoding="async">

*Measured charge (top) and light (middle) yields for nuclear recoils in LUX, with Lindhard-model fits, and the corresponding detection efficiencies (bottom). (Figure reproduced in my Ph.D. thesis from the LUX Collaboration result, Phys. Rev. Lett. 116, 161301 (2016).)*

## Impact on the WIMP Search

The [2016 reanalysis of the LUX WIMP search](https://arxiv.org/abs/1512.03506) used a Lindhard-based NEST signal model fit to the D-D calibration data, together with improvements to event reconstruction and background modeling. Sensitivity to a 7 GeV/c^2 WIMP improved by a factor of seven, increasing the tension with low-mass WIMP signal claims from other experiments ([thesis §9.3, printed p.228 / PDF p.252](https://repository.library.brown.edu/studio/item/bdr:674209/)).

The calibration also covers the nuclear recoil energies expected from coherent elastic scattering of solar boron-8 neutrinos. Their maximum recoil energy in xenon is about 3.7 keV.

<img src="{{ '/assets/images/lux-wimp-limits-2016.png' | relative_url }}" alt="Upper limits on the spin-independent WIMP-nucleon cross section versus WIMP mass, comparing the 2016 LUX result against the 2014 result and contemporaneous experiments" width="1385" height="952" loading="lazy" decoding="async">

*Ninety percent confidence upper limits on the spin-independent WIMP-nucleon cross section: the 2016 LUX reanalysis incorporating this calibration (black), the 2014 LUX result (gray), and contemporaneous experiments. (Figure reproduced in my Ph.D. thesis from the LUX Collaboration result, Phys. Rev. Lett. 116, 161301 (2016).)*

## D-D calibration for LZ
{: #carried-into-lz }

D-D calibration was included in the design of LZ, the 10-tonne successor to LUX within the same water shield. I served as L3 manager for the D-D calibration program during the early design phase.

We also proposed a quasi-monoenergetic 272 keV neutron source produced by backscattering D-D neutrons from deuterium. The lower neutron energy gives an 8 keV recoil endpoint in xenon. A 1 keV recoil corresponds to about 41 degrees, compared with about 13 degrees for a 2.45 MeV neutron, reducing the fractional uncertainty in recoil energy from vertex-position reconstruction.

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
