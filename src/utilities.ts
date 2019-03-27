export function merge(source, target) {
	if (target === undefined) {
		return source;
	}

	Object.entries(source).forEach(function([key, value]) {
		if (target[key] === undefined) {
			target[key] = value;
		}
	});

	return target;
}
