import resolve from "dns-resolve";

export default async (
  hostname: string,
  options?: Parameters<typeof resolve>[2]
) => {
  await Promise.any([
    resolve(hostname, "A", options),
    resolve(hostname, "AAAA", options),
  ]);
};
