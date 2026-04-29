# ARB Test Fixture And Calibration Plan

Last updated: April 10, 2026

## Purpose

Define how to validate the ARB feature using representative review packages and reviewer calibration.

## Test Fixture Categories

### 1. Strong Package

Characteristics:
- complete SOW
- clear design document
- architecture diagram
- security and DR notes
- explicit operational ownership

Expected outcome:
- high confidence
- mostly matched requirements
- few or no critical blockers
- likely Approved or Approved with Conditions

### 2. Weak Package

Characteristics:
- basic design narrative
- limited operational detail
- some security ambiguity
- missing DR or monitoring details

Expected outcome:
- medium or low confidence
- several findings
- likely Needs Improvement

### 3. Incomplete Package

Characteristics:
- missing SOW or missing design doc
- missing key evidence inputs
- sparse or ambiguous architecture text

Expected outcome:
- Insufficient Evidence or Needs Improvement depending on gap type

### 4. Policy Conflict Package

Characteristics:
- explicit requirement present
- design clearly violates region, security, or resilience need

Expected outcome:
- deterministic blocker hit
- recommendation not approvable

## Calibration Process

1. Create 5 to 10 benchmark packages
2. Have senior reviewers score them manually
3. Run ARB engine on same packages
4. Compare:
   - recommendation outcome
   - blocker detection
   - score bands
   - missing evidence handling
5. Tune rules and scoring weights

## Validation Measures

- requirement extraction precision
- evidence extraction usefulness
- blocker true positive rate
- false positive rate on hard rules
- agreement rate between ARB output and senior reviewer judgment
- usefulness of action list to PMs

## MVP Recommendation

For MVP:
- create at least one package in each category
- use reviewer workshops to tune first-pass rules
- lock baseline fixtures into regression testing once stable
