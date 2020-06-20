Air.defineClass(
    'class.SimilarArticles',
    'lib.DOM, class.Dropdown',
    function ($, Dropdown) {

        'use strict';

        var CSS = {
            editorSimilar: 'editor__similar',
            editorCenter: 'editor__center'
        };

        /**
         * SimilarArticles constructor
         *
         * @param  {Element} options.element - holder for helper
         * @param  {String} options.label    - input label
         *
         */
        return class SimilarArticles {

            constructor({
                element,
                label
            }) {

                this.holder = element;
                this.wrapper = $.make('div', [CSS.editorSimilar]);
                this.center = $.make('div', [CSS.editorCenter], {
                    innerHTML: `<label>${label}</label>`
                });
                this.input = $.make('input', [], {
                    name: "similar",
                    hidden: 'true'
                });

                this.center.appendChild(this.input);
                this.wrapper.appendChild(this.center);
                this.holder.appendChild(this.wrapper);

                this.init(this.input);

            }

            /**
             * Initiates Dropdown class
             * @uses  for similar articles input
             * @param {Element} input  - input to bind Dropdown
             */
            init(input) {

                console.assert(input, 'Cannot activate Dropdown class for similar-articles because input was not found');

                this.dropdown = new Dropdown({
                    element: input,
                    urls: {
                        search: '/writing/similar_autocomplete',
                        select: '/writing/similar_substitution'
                    },
                    placeholder: 'Заголовок или ссылка на статью',
                    handlers: {
                        onProcess: (state) => {}
                    },
                    primary_key: 'id',
                    renderFoundItem: (data, search_text) => {
                        return `<p>
                            ${data.title.replace(new RegExp('(' + search_text + ')', 'gi'), '<span>$1</span>')}
                        </p>
                        <p>
                            ${data.url}
                            <time>${data.date}</time>
                        </p>`;
                    },
                    renderSelectedItem: (data) => {
                        return '<p>' + data.title + '</p>';
                    }
                });

            }

            /**
             * Show selected articles
             */
            showSelected() {
                this.dropdown.showSelected();
            }

            /**
             * Destroy dropdown
             */
            destroy() {
                this.dropdown.destroy();
            }

        };

    }
);