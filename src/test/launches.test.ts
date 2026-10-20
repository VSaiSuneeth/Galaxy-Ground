import { describe, expect, it } from "vitest";
import { filterLaunches, groupLaunchesByMonth, type Launch } from "@/lib/launches";

const launches: Launch[] = [
  {
    slug: "starship-flight-test",
    missionName: "Starship Flight Test",
    rocket: "Starship",
    agency: "SpaceX",
    launchDate: "2026-08-02T12:00:00Z",
    pad: "Starbase",
    payload: "Vehicle test",
    status: "TBD",
    description: "Reusable vehicle test",
  },
  {
    slug: "gaganyaan-g1",
    missionName: "Gaganyaan G1",
    rocket: "LVM3",
    agency: "ISRO",
    launchDate: "2026-07-15T04:30:00Z",
    pad: "Satish Dhawan",
    payload: "Orbital test",
    status: "NET",
    description: "Crewed readiness test",
  },
  {
    slug: "neutron-demo",
    missionName: "Neutron Demo",
    rocket: "Neutron",
    agency: "Rocket Lab",
    launchDate: "2026-08-18T16:00:00Z",
    pad: "Wallops",
    payload: "Demo payload",
    status: "NET",
    description: "Reusable demonstration",
  },
];

describe("launch calendar helpers", () => {
  it("filters launches by status and agency", () => {
    const result = filterLaunches(launches, { status: "NET", agency: "Rocket Lab" });

    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe("neutron-demo");
  });

  it("groups launches into month buckets with stable headings", () => {
    const result = groupLaunchesByMonth(launches);

    expect(result).toEqual([
      { month: "July 2026", launches: [launches[1]] },
      { month: "August 2026", launches: [launches[0], launches[2]] },
    ]);
  });
});
