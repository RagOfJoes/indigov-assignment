import crypto, { scrypt } from "node:crypto";

export async function generate_passsword(password: string): Promise<string> {
	const salt = crypto.randomBytes(16).toString("base64");
	const key = await new Promise<string>((resolve, reject) => {
		scrypt(
			password,
			salt,
			64,
			{
				N: 16384,
				p: 1,
				r: 16,
				maxmem: 128 * 16384 * 16 * 2,
			},
			(err, buff) => {
				if (err) {
					return reject(err);
				}

				return resolve(buff.toString("base64"));
			},
		);
	});

	return `${salt}:${key}`;
}

export async function verify_password(
	hash: string,
	password: string,
): Promise<boolean> {
	return new Promise((resolve, reject) => {
		const [salt, key] = hash.split(":");
		scrypt(
			password,
			salt!,
			64,
			{
				N: 16384,
				p: 1,
				r: 16,
				maxmem: 128 * 16384 * 16 * 2,
			},
			(err, derived) => {
				if (err) {
					reject(err);
				}

				resolve(key === derived.toString("base64"));
			},
		);
	});
}
