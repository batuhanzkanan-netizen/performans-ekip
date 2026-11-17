const { test } = require("node:test");
const assert = require("node:assert/strict");
const { withoutEmail } = require("./access");
test("Hesap silme yalnız ilgili e-postayı her iki listeden kaldırır", () => {
  assert.deepEqual(
    withoutEmail(
      {
        editors: ["a@example.com", "b@example.com"],
        viewers: ["a@example.com", "c@example.com"],
      },
      "a@example.com",
    ),
    { editors: ["b@example.com"], viewers: ["c@example.com"] },
  );
});
test("Eksik listeler güvenli biçimde ele alınır", () => {
  assert.deepEqual(withoutEmail({}, "a@example.com"), {
    editors: [],
    viewers: [],
  });
});
