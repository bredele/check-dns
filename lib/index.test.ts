import test from "node:test";
import assert from "node:assert";
import check from ".";

test("DNS Health Check - Success Cases", async (t) => {
  await t.test("should resolve domain with A record (google.com)", async () => {
    await assert.doesNotReject(check("google.com"));
  });

  await t.test(
    "should resolve domain with both A and AAAA records (github.com)",
    async () => {
      await assert.doesNotReject(check("github.com"));
    }
  );

  await t.test(
    "should resolve IPv6-enabled domain (ipv6.google.com)",
    async () => {
      await assert.doesNotReject(check("ipv6.google.com"));
    }
  );

  await t.test("should resolve with custom timeout", async () => {
    await assert.doesNotReject(check("google.com", { timeout: 10000 }));
  });
});

test("DNS Health Check - Failure Cases", async (t) => {
  await t.test("should reject for non-existent domain", async () => {
    await assert.rejects(
      check("this-domain-absolutely-does-not-exist-12345.com"),
      (error) => {
        assert.ok(error instanceof AggregateError);
        assert.strictEqual(error.errors.length, 2);
        assert.match(error.errors[0].code, /ENOTFOUND|ENODATA/);
        assert.match(error.errors[1].code, /ENOTFOUND|ENODATA/);
        return true;
      }
    );
  });

  await t.test("should reject for invalid domain format", async () => {
    await assert.rejects(check("invalid..domain"), (error) => {
      assert.ok(error instanceof AggregateError);
      return true;
    });
  });

  await t.test(
    "should reject with AggregateError when both A and AAAA fail",
    async () => {
      await assert.rejects(
        check("nonexistent-test-domain-xyz.invalid"),
        (error) => {
          assert.ok(error instanceof AggregateError);
          assert.strictEqual(error.message, "All promises were rejected");
          assert.strictEqual(error.errors.length, 2);
          return true;
        }
      );
    }
  );
});

test("DNS Health Check - Timeout & Network Configuration", async (t) => {
  await t.test("should handle custom DNS servers", async () => {
    await assert.doesNotReject(
      check("google.com", { servers: ["8.8.8.8", "8.8.4.4"] })
    );
  });

  await t.test("should handle short timeout with unreachable server", async () => {
    await assert.rejects(
      check("google.com", { timeout: 100, servers: ["192.0.2.1"] }),
      (error) => {
        assert.ok(error instanceof AggregateError);
        return true;
      }
    );
  });

  await t.test("should handle custom tries configuration", async () => {
    await assert.doesNotReject(check("google.com", { tries: 2 }));
  });
});

test("DNS Health Check - Edge Cases", async (t) => {
  await t.test("should reject empty hostname", async () => {
    await assert.rejects(check(""), (error) => {
      assert.ok(error instanceof AggregateError);
      return true;
    });
  });

  await t.test("should reject whitespace-only hostname", async () => {
    await assert.rejects(check("   "), (error) => {
      assert.ok(error instanceof AggregateError);
      return true;
    });
  });

  await t.test("should handle localhost", async () => {
    await assert.doesNotReject(check("localhost"));
  });

  await t.test("should reject for IP addresses (not hostnames)", async () => {
    await assert.rejects(check("192.168.1.1"), (error) => {
      assert.ok(error instanceof AggregateError);
      return true;
    });
  });

  await t.test("should handle very long hostname", async () => {
    const longHostname = "a".repeat(250) + ".com";
    await assert.rejects(check(longHostname), (error) => {
      assert.ok(error instanceof AggregateError);
      return true;
    });
  });
});

test("DNS Health Check - Options Parameter Validation", async (t) => {
  await t.test("should work with undefined options", async () => {
    await assert.doesNotReject(check("google.com", undefined));
  });

  await t.test("should work with empty options object", async () => {
    await assert.doesNotReject(check("google.com", {}));
  });

  await t.test("should handle invalid servers array", async () => {
    await assert.rejects(
      check("google.com", { servers: ["invalid-server"] }),
      (error) => {
        assert.ok(error instanceof AggregateError);
        return true;
      }
    );
  });

  await t.test("should handle multiple configuration options", async () => {
    await assert.doesNotReject(
      check("google.com", {
        timeout: 5000,
        tries: 3,
        servers: ["8.8.8.8"],
      })
    );
  });
});
