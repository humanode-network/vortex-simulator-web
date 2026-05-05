import { test, expect } from "@rstest/core";

import {
  addressIdentityKey,
  addressesReferToSameIdentity,
} from "../../src/lib/addressIdentity";

const genericAddress = "5C62Ck4UrFPiBtoCmeSrgF7x9yv9mn38446dhCpsi2mLHiFT";
const canonicalAddress = "hmnVXRhJsFLh5CbdxZNrn5Lu6FR2nDacxgSLrsVoyoW9ERXAP";

test("addressIdentityKey resolves same-key SS58 encodings", () => {
  expect(addressIdentityKey(genericAddress)).toBe(
    addressIdentityKey(canonicalAddress),
  );
});

test("addressesReferToSameIdentity falls back to case-insensitive string identity", () => {
  expect(addressesReferToSameIdentity("0xAlice", "0xalice")).toBe(true);
  expect(addressesReferToSameIdentity("0xAlice", "0xBob")).toBe(false);
  expect(addressesReferToSameIdentity("", "0xBob")).toBe(false);
});
