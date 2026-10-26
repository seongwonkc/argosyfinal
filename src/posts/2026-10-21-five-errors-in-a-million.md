---
# Sources (not rendered):
# Oct 19 2026 announcement; Helios; logical fidelity 99.9995%, ~5 errors per million; color code up to 37 physical qubits; 10x own Sept 2026 record (Helix code); 100x best published other-hardware result (Google Quantum AI, superconducting); error suppression factor 12; Apollo target range, fault-tolerant by 2029; Blume-Kohout quote -> https://www.quantinuum.com/press-releases/quantinuum-breaks-error-correction-world-record-by-10x-validating-its-leading-path-to-fault-tolerant-quantum-computing-by-2029
# Science News Oct 20 2026: paper posted on company site and arXiv Oct 19; Helios 98 trapped-ion qubits over a chip; 37-qubit logical qubit; lambda ~10 vs Google 2024 ~2 (errors halved); single logical qubit; megaquop = ~a million reliable operations, not yet reached, could need 50-100 logical qubits; Ken Brown quote -> https://www.sciencenews.org/article/quantum-computer-megaquops-error-correction
title: 'Five Errors in a Million: A Quantum Record, Read Carefully'
author: Ejin Chung
category: Science and Technology
date: 2026-10-21T00:00:00.000Z
layout: layouts/post.njk
tags:
  - quantum
  - computing
  - physics
  - technology
excerpt: >-
  This week a quantum computer kept one logical qubit almost perfectly clean
  across a million operations, beating every published record by a wide
  margin, by the company's count. It's the right kind of quantum news, because it's about errors, not
  speed. It also comes with fine print worth reading slowly.
image: /assets/images/2026/five-errors-in-a-million.jpg
image_credit: 'Pachon in Motion — Pexels'
---

A year ago this desk celebrated a Nobel for the circuit that grew up to become the superconducting qubit, and closed with a warning: the error rates downstream of that prize were brutal. This week brought the best error number I have ever had the chance to report. It came from a different hardware family entirely.

On October 19, the quantum computing company Quantinuum announced that its Helios machine had run a logical qubit at a fidelity of 99.9995 percent, which works out to roughly five errors per million operations. The company says that is ten times better than its own record from September and a hundred times better than the best published result on any other type of hardware, held by Google's superconducting team.

**Why Errors Are the Whole Game**

Qubits are fragile. A tiny disturbance — a little heat, a stray field, an imperfect control pulse — knocks them off course, and a long calculation piles up mistakes until the answer is noise. The field's plan is error correction: spread one piece of information across many physical qubits so the group can catch and fix individual slips. That bundle is called a logical qubit.

The catch is that every extra physical qubit is also a new place for errors to sneak in. Error correction only pays off if making the bundle bigger makes it better. That is the number I care about most, and it's the real headline. Science News reports that each time Quantinuum enlarged its code, the logical error rate fell by a factor of about ten; the company puts the figure at twelve. Google's 2024 demonstration, by the same measure, roughly halved its errors with each step up. Ken Brown of Duke University, who was not involved in the work, explained why that gap matters: "That's a huge savings in the overall number of qubits you would need."

**The Machine Behind It**

Helios doesn't use superconducting circuits at all. Its 98 qubits are electrically charged atoms, ions, hovering over a chip, and the record logical qubit was built from 37 of them. I find this a satisfying plot twist. Last year's Nobel went to the superconducting lineage; this month's error record went to trapped ions. Scoreboards don't care about pedigree.

**The Fine Print**

Now the calibration this desk owes you, in three parts.

First, this is one logical qubit. Useful machines need many of them working together. Science News describes the next milestone, the "megaquop" regime of about a million reliable operations, as not yet reached and estimates it could take 50 to 100 logical qubits. One excellent brick is not a building.

Second, the paper was posted on Quantinuum's website and on arXiv, a preprint server, the same day as the announcement. That means outside referees have not yet formally reviewed it. Preprints are how fast-moving physics shares results, and they are also where results get their first round of scrutiny.

Third, the headline comparisons come from the company's own press release, and companies grade their own homework generously. Still, an outsider was impressed. Robin Blume-Kohout of Sandia National Laboratories, who was not involved, described the result as "a logical qubit nearly 100x better than its component physical qubits."

Quantinuum also says the result puts its accuracy in the target range for Apollo, a fault-tolerant quantum computer it expects to deliver by 2029. That is a roadmap, and roadmaps live in the "promised" column until they ship. I have watched enough useful-machine dates slide on this beat to keep that column separate.

**The Score**

So: a real result, and the right kind. Not a speed race, but the dull, essential measurement underneath every speed race — does adding qubits make the machine better? — and the answer came back yes, by a lot. Last year's laureates spent decades learning to keep a circuit quiet. This month a bundle of ions got quieter than anything before it.

Scoreboard for the week: five errors, one million operations, one logical qubit. Ask me again when that last number reads fifty.
