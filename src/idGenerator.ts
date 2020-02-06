
/**returns an id generator returning a series starting from 0 or from the given seed */
export default function idGenerator(seed = 0) {

    return function () {
        var nextId = seed;
        seed++;
        return nextId;
    }
};