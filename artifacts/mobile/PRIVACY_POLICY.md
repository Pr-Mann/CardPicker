# Privacy Policy — NearbyStores

**Last updated:** March 15, 2026

## Overview

NearbyStores ("the App") helps you discover stores near your current location. We are committed to protecting your privacy.

## Location Data

The App requests access to your device's GPS location **only while the app is in use** (foreground location). This data is used solely to:

- Determine your approximate position
- Query the Google Places API to find stores near you
- Sort results by distance from your location

**We do not store your location data on any server.** Location coordinates are sent directly from your device to Google's Places API for the purpose of fetching nearby store results, and are not retained after the request completes.

## Third-Party Services

### Google Places API / Google Maps Platform

The App uses the Google Places API to retrieve nearby store information. When you use the App, your location coordinates are transmitted to Google's servers as part of this API request. Google's use of this data is governed by [Google's Privacy Policy](https://policies.google.com/privacy).

## Data We Collect

| Type | Purpose | Storage |
|------|---------|---------|
| GPS Coordinates | Finding nearby stores | Not stored — transmitted once per search |
| Onboarding completion flag | App state persistence | Stored locally on your device only |

## Your Rights

- **iOS users:** You may revoke location permission at any time in Settings → Privacy & Security → Location Services → NearbyStores.
- **Android users:** You may revoke location permission at any time in Settings → Apps → NearbyStores → Permissions → Location.

## Children's Privacy

The App does not knowingly collect any data from children under the age of 13.

## Contact

If you have questions about this privacy policy, please contact us at: **privacy@nearbystores.app**

---

## App Store / Play Store Compliance Notes

This app:
- Requests `NSLocationWhenInUseUsageDescription` (iOS) — location used only while app is open
- Declares `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions (Android)
- Does not use background location
- Does not sell, share, or store user location data
- Uses Google Maps Platform APIs in compliance with [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms)
