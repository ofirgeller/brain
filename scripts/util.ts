namespace util {

    /**returns a serial number generator starting from 0 by defult */
    export function serialGenerator(seed = 0) {

        return function () {
            var nextId = seed;
            seed++;
            return nextId;
        }
    };

}