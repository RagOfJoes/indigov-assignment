export function formDataToBody(data: FormData): URLSearchParams {
	const body = new URLSearchParams();
	// eslint-disable-next-line no-restricted-syntax
	for (const [name, value] of data.entries()) {
		body.set(name, value.toString());
	}

	return body;
}
