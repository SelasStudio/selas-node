import { createSelasClient } from "../src/index";

describe("testing index file", () => {
  test("creation of a selas client", async () => {
    const selas = await createSelasClient({ email: "benjamin@selas.studio", password: "tromtrom" });

    const { data: credits } = await selas.getCustomerCredits("leopold");
    expect(credits).toBe(0);
  });
});
