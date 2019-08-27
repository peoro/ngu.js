
// This module exposes functions to create a decision table to identify images
// This stuff is needed because NGU images are slightly different at times: items in the item list, for instance, are barely brighter than in the inventory
// The idea is the following: we work with the bytes an image is made of (i.e. 1 byte per color channel per pixel)
// We partition all the images we know of in a tolerand way: "white" bytes (i.e. close to 0xFF) go in a partition, "black" bytes (i.e. close to 0) go in the other partition, "gray" bytes (i.e. close to 0x80) go in both
// The decision tree we build gives us, for each node, which byte to consider; we select the left or right partition depending on the byet's value and recurse.

// `item` in the following, is an image (i.e. a `Uint8Array`)

// [item], [itemID], index -> score
// the smaller the score, the better
function computeScoreForIndex( set, items, index ) {
	let left = 0, right = 0;
	items.forEach( (itemID)=>{
		const item = set[ itemID ];
		const val = item[index];
		if( val < 255-96 ) { ++left; }
		if( val > 96 ) { ++right; }
	});

	const score = left*left + right*right;
	return score;
}

function makeDecisionTree( indexCount, set, items=set.map((item,i)=>i) ) {
	if( items.length <= 1 ) {
		// found a leaf, no need to further partition
		return items[0];
	}

	let index = -1; // the index we'll use to partition

	// picking the decision index: the best index to partition items
	let bestScore = Infinity;
	for( let i = 0; i < indexCount; ++i ) {
		const score = computeScoreForIndex( set, items, i );

		if( score < bestScore ) {
			bestScore = score;
			index = i;
		}
	}

	const left = items.filter( (itemID)=>set[itemID][index] < 255-96 );
	const right = items.filter( (itemID)=>set[itemID][index] > 96 );

	if( left.length === items.length || right.length === items.length ) {
	}

	return [
		index,
		makeDecisionTree( indexCount, set, left ),
		makeDecisionTree( indexCount, set, right ),
	];
}

function search( decisionTree, item ) {
	if( Array.isArray(decisionTree) ) {
		if( DEV ) { console.assert( decisionTree.length === 3 ); }

		const [index, left, right] = decisionTree;
		return item[index]<128 ? search(left, item) : search(right, item);
	}

	// `decisionTree` was a leaf, let's just return it
	return decisionTree;
}

Object.assign( modules.export, {
	makeDecisionTree, search,
};
