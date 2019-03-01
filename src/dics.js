/*
 * Dics: Simple multiple image comparison.
 *
 * By Abel Cabeza Román
 * Src:
 * Example
 */

(function (root) {

    const defaultOptions = {
        container: null,
        data: null,
        filters: null,
        hideTexts: null,
        linesOrientation: 'horizontal'
    };


    /**
     * Constructor
     * @param options
     */
    function Dics(options) {
        this.options = utils.extend({}, [defaultOptions, options], {
            clearEmpty: true
        });

        this._setOrientation(this.options.linesOrientation);
        this.container     = this.options.container;
        this.images        = this._getImages();
        this.sliders       = [];
        this._activeSlider = null;

        if (this.container == null) {
            console.error('Container element not found!')
        }

        this._build();
        this.sections = this._getSections();
        this._setEvents();

    }

    Dics.prototype._getImages = function () {
        return this.container.querySelectorAll('img');
    };


    Dics.prototype._getSections = function () {
        return this.container.querySelectorAll('[data-function="b-dics__section"]');
    };

    Dics.prototype._createElement = function (elementClass, className) {
        let newElement = document.createElement(elementClass);

        newElement.classList.add(className);

        return newElement;
    };


    /**
     * Build HTML structure
     * @private
     */
    Dics.prototype._build = function () {
        let dics = this;

        dics._applyGlobalClass(dics.options);

        let imagesLength = dics.images.length;

        dics.options.container.style.height = `${dics._calcContainerHeight()}px`;

        let initialImagesContainerWidth = dics.container[dics.options.offsetField] / imagesLength;

        for (let i = 0; i < imagesLength; i++) {
            let image          = dics.images[i];
            let section        = dics._createElement('div', 'b-dics__section');
            let imageContainer = dics._createElement('div', 'b-dics__image-container');
            let slider         = dics._createElement('div', 'b-dics__slider');

            dics._applyFilter(image, i, dics.options.filters);
            dics._createAltText(image, imageContainer);


            section.setAttribute('data-function', 'b-dics__section');
            section.style.width = `${initialImagesContainerWidth}px`;
            slider.style.left   = `${initialImagesContainerWidth * (i + 1)}px`;

            this.sliders.push(slider);

            image.classList.add('b-dics__image');

            section.appendChild(imageContainer);
            imageContainer.appendChild(image);

            if (i < imagesLength - 1) {
                section.appendChild(slider);
            }

            dics.container.appendChild(section);

            image.style.left = `${ i * -initialImagesContainerWidth }px`;

        }
    };


    /**
     * Set need DOM events
     * @private
     */
    Dics.prototype._setEvents = function () {
        let dics = this;

        dics._disableImageDrag();

        let listener = function (event) {
            let position = dics._calcPosition(event);
            if (position < (dics.sections[dics._activeSlider + 1].offsetLeft + dics.sections[dics._activeSlider + 1][dics.options.offsetField]) && (dics._activeSlider === 0 || position > (dics.sections[dics._activeSlider - 1].offsetLeft + dics.sections[dics._activeSlider - 1][dics.options.offsetField]))) {

                let beforeSectionsWidth = dics._beforeSectionsWidth(dics.sections, dics.images, dics._activeSlider);

                dics.sliders[dics._activeSlider].style.left = `${position}px`;

                let calcMovePixels                                = position - beforeSectionsWidth;
                dics.sections[dics._activeSlider].style.width     = `${calcMovePixels}px`;
                dics.sections[dics._activeSlider + 1].style.width = `${dics._beforeNextWidth - (calcMovePixels - dics._beforeActiveWidth) }px`;

                dics._setLeftToImages(dics.sections, dics.images);
                dics._slidesFollowSections(dics.sections, dics.sliders);
            }

        };

        dics.container.addEventListener('click', listener);

        for (let i = 0; i < dics.sliders.length; i++) {
            let slider = dics.sliders[i];
            utils.setMultiEvents(slider, ['mousedown', 'touchstart'], function () {
                dics._activeSlider      = i;
                dics._beforeActiveWidth = dics.sections[i].getBoundingClientRect().width;
                dics._beforeNextWidth   = dics.sections[i + 1].getBoundingClientRect().width;
                slider.classList.add('b-dics__slider--active');

                utils.setMultiEvents(dics.container, ['mousemove', 'touchmove'], listener);
            });
        }


        let listener2 = function () {
            let activeElements = dics.container.querySelectorAll('.b-dics__slider--active');

            for (let activeElement of activeElements) {
                activeElement.classList.remove('b-dics__slider--active');
                utils.removeMultiEvents(dics.container, ['mousemove', 'touchmove'], listener);
            }
        };

        utils.setMultiEvents(document.body, ['mouseup', 'touchend'], listener2);


        utils.setMultiEvents(window, ['resize', 'load'], function () {
            dics._setImageSize();
        });


    };

    Dics.prototype._beforeSectionsWidth = function (sections, images, activeSlider) {
        let width = 0;
        for (let i = 0; i < sections.length; i++) {
            let section = sections[i];
            if (i !== activeSlider) {
                width += section.getBoundingClientRect().width;
            } else {
                return width
            }
        }
    };

    Dics.prototype._calcContainerHeight = function () {
        let imgHeight      = this.images[0].clientHeight;
        let imgWidth       = this.images[0].clientWidth;
        let containerWidth = this.options.container.getBoundingClientRect().width;

        return (containerWidth / imgWidth) * imgHeight;
    };

    Dics.prototype._setLeftToImages = function (sections, images) {
        let width = 0;
        for (let i = 0; i < images.length; i++) {
            let image = images[i];

            image.style.left = `-${width}px`;
            width += sections[i].getBoundingClientRect().width;
        }
    };

    Dics.prototype._slidesFollowSections = function (sections, sliders) {
        let left = 0;
        for (let i = 0; i < sections.length; i++) {
            let section = sections[i];
            left += section.getBoundingClientRect().width;
            if (i === this._activeSlider) {
                sliders[i].style.left = `${left}px`;
            }
        }
    };

    Dics.prototype._disableImageDrag = function () {
        for (let i = 0; i < this.images.length; i++) {
            this.sliders[i].addEventListener('dragstart', function (e) {
                e.preventDefault();
            });
            this.images[i].addEventListener('dragstart', function (e) {
                e.preventDefault();
            });
        }
    };

    Dics.prototype._applyFilter = function (image, index, filters) {
        if (filters) {
            image.style.filter = filters[index];
        }
    };

    Dics.prototype._applyGlobalClass = function (options) {
        let container = options.container;

        container.classList.add('b-dics');

        if (options.hideTexts) {
            container.classList.add('b-dics--hide-texts');

        }
    };
    Dics.prototype._createAltText    = function (image, imageContainer) {
        let textContent = image.getAttribute('alt');
        if (textContent) {
            let text = this._createElement('p', 'b-dics__text');

            text.appendChild(document.createTextNode(textContent));

            imageContainer.appendChild(text);
        }
    };


    Dics.prototype._removeActiveElements = function () {
        let activeElements = Dics.container.querySelectorAll('.b-dics__slider--active');

        for (let activeElement of activeElements) {
            activeElement.classList.remove('b-dics__slider--active');
            utils.removeMultiEvents(Dics.container, ['mousemove', 'touchmove'], Dics.prototype._removeActiveElements);
        }
    };


    Dics.prototype._setOrientation = function (linesOrientation) {
        if (linesOrientation === 'horizontal') {
            this.options.offsetField   = 'offsetWidth';
            this.options.positionField = 'left';
        }

    };


    /**
     * Calc current position (click, touch or move)
     * @param event
     * @private
     */
    Dics.prototype._calcPosition = function (event) {
        let containerCoords = this.container.getBoundingClientRect();
        let xPixel          = !isNaN(event.clientX) ? event.clientX : event.touches[0].pageX;

        return containerCoords.left < xPixel ? xPixel - containerCoords.left : 0;
    };


    /**
     * Set the width of image that has a position absolute
     * @private
     */
    Dics.prototype._setImageSize = function () {
        this.images[0].style.width = this.container[this.options.offsetField] + 'px';
    };


    /**
     * Utils Methods
     * @type {{extend: Function, getConstructor: Function}}
     */
    let utils = {


        /**
         * Native extend object
         * @param target
         * @param objects
         * @param options
         * @returns {*}
         */
        extend: function (target, objects, options) {

            for (let object in objects) {
                if (objects.hasOwnProperty(object)) {
                    recursiveMerge(target, objects[object]);
                }
            }

            function recursiveMerge(target, object) {
                for (let property in object) {
                    if (object.hasOwnProperty(property)) {
                        let current = object[property];
                        if (utils.getConstructor(current) === 'Object') {
                            if (!target[property]) {
                                target[property] = {};
                            }
                            recursiveMerge(target[property], current);
                        }
                        else {
                            // clearEmpty
                            if (options.clearEmpty) {
                                if (current == null) {
                                    continue;
                                }
                            }
                            target[property] = current;
                        }
                    }
                }
            }

            return target;
        },


        /**
         * Set Multi addEventListener
         * @param element
         * @param events
         * @param func
         */
        setMultiEvents: function (element, events, func) {
            for (let i = 0; i < events.length; i++) {
                element.addEventListener(events[i], func);
            }
        },

        /**
         * Set Multi addEventListener
         * @param element
         * @param events
         * @param func
         */
        removeMultiEvents: function (element, events, func) {
            for (let i = 0; i < events.length; i++) {
                element.removeEventListener(events[i], func, false);
            }
        },


        /**
         * Get object constructor
         * @param object
         * @returns {string}
         */
        getConstructor: function (object) {
            return Object.prototype.toString.call(object).slice(8, -1);
        }
    };


    if (typeof define === 'function' && define.amd) {
        define('Dics', [], function () {
            return Dics;
        });
    }
    else {
        root.Dics = Dics;
    }


}(this));


