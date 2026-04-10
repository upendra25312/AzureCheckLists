# ARB Decision Center Specification

Last updated: April 10, 2026

## Purpose

Define the Decision Center behavior for the AI-assisted Architecture Review Board workflow.

## Goal

Provide a dedicated governance surface where reviewers can:
- inspect AI recommendation
- inspect blockers and conditions
- review score rationale
- record final decision
- maintain sign-off history

## Core Sections

### 1. Review Summary

Show:
- project name
- review id
- workflow state
- assigned reviewer
- last updated
- evidence readiness state

### 2. AI Recommendation

Show:
- recommendation badge
- overall score
- confidence
- critical blockers count
- short rationale summary

### 3. Decision Inputs

Reviewer can record:
- final decision
- decision rationale
- conditions
- must-fix actions
- re-review required yes/no

### 4. Sign-off Log

Track:
- reviewer name
- decision
- timestamp
- rationale
- changes from prior decision if any

## Allowed Final Decisions

- Approved
- Approved with Conditions
- Needs Improvement
- Closed
- Rejected due to Insufficient Evidence

## UX Rules

- AI recommendation must be visible but clearly marked advisory
- final decision controls must be restricted to reviewer/admin roles
- conditions and must-fix items must be editable before final save
- critical blockers must be visually prominent
- reviewer rationale should be mandatory when final decision differs from AI recommendation

## Recommended Layout

### Top Strip
- overall score
- AI recommendation
- final decision state
- confidence
- blockers

### Center Panel
- rationale summary
- blockers list
- conditions list
- must-fix actions

### Right Rail
- reviewer decision form
- save decision
- close review
- export summary

## Validation Rules

- cannot mark Approved if unresolved critical blockers exist
- cannot mark Approved with Conditions without at least one tracked condition or action
- cannot close review without recorded final decision
- cannot override AI recommendation without rationale

## Audit Requirements

Every final decision event should store:
- reviewer identity
- decision value
- rationale
- timestamp
- prior decision state
- linked scorecard version
