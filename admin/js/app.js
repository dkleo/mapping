$body = $("body");

var table;

$(document).on({
    ajaxStart: function() {
        $body.addClass("loading");
    },
    ajaxStop: function() {
        $body.removeClass("loading");
    },
    ajaxError: function() {
        $body.removeClass('loading');
    }
});

//Load
$(function() {
    $.ajaxSetup({
        // Disable caching of AJAX responses */
        cache: false
    });

    function hashGrab() {
        var hash = window.location.hash.substring(1).split('/')[1];
        loadPage(hash);
    }

    // Bind an event to window.onhashchange that, when the hash changes, gets the
    // hash and adds the class "selected" to any matching nav link.
    $(window).on('hashchange', function() {
        hashGrab();
    })

    //initial Load
    $(window).load(function() {
        hashGrab();
    });

});

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1].replace('/', '');
        }
    }
};

function loadPage(hash) {

    $("#content-root").hide();

    if (hash == '' || hash == undefined) {
        hash = 'suggestions';
    }

    $("#content-root").load("templates/" + hash + ".html", function(responseText, textStatus, req) {
        if (textStatus == "error") {
            $("#content-root").load("templates/404.html", function() {});
        } else {
            var handler = hash.replace(/-/, '_') + '_handler';
            if (window[handler]){
                var handler = window[handler];
                
                //Change Page Title
                document.title = handler.properties.title;

                //Start Table population
                table = $('#datatable').DataTable({
                    ajax: handler.properties.ajaxURL,
                    colReorder: true,
                    lengthMenu: [
                        [25, 50, 100, -1],
                        [25, 50, 100, "All"]
                    ],
                    order: [],
                    scrollX: true,
                    autoFill: false,
                    select: {
                        style: 'selected',
                        items: 'row',
                        blurable: true
                    },
                    fixedHeader: true,
                    fixedColumns:   {
                        leftColumns: 1
                    },
                    columns: handler.columns,
                    columnDefs: [
                        // {
                        //     targets: [ 2 ],
                        //     visible: false,
                        //     searchable: false
                        // },
                        // {
                        //     targets: [ 3 ],
                        //     visible: false
                        // },
                        {
                            targets: 'no-sort',
                            orderable: false,
                        }
                    ],
                    // Sets Row ID
                    rowId: 'id',

                    // createdRow: function( row, data, dataIndex ) {
                    //         $( row ).find('td:eq(1)').attr('class', 'name');
                    //     },


                    initComplete: function() {

                        // Apply the search
                        table.columns('.search').every(function() {
                            var that = this;

                            var search = $('<input type="text" placeholder="Search...">')
                                .appendTo( $(that.footer()).empty() )
                                .on('keyup change', function() {
                                if (that.search() !== this.value) {
                                    that
                                        .search(this.value)
                                        .draw();
                                }

                                } );

                        });

                        // Apply the select
                        table.columns('.select').every(function() {
                            var that = this;

                            var select = $('<select><option value=""></option></select>')
                                .appendTo( $(that.footer()).empty() )
                                .on( 'change', function () {
                                    var val = $.fn.dataTable.util.escapeRegex(
                                        $(this).val()
                                    );
                            
                                    that
                                        .search( val ? '^'+val+'$' : '', true, false )
                                        .draw();
                                } );
                            
                            that.data().unique().sort().each( function ( d, j ) {
                                select.append( '<option value="'+d+'">'+d+'</option>' )
                            });

                        });

                        table.columns.adjust().draw();


                    }

                });

                //Grab events
                handler.events();
            }
        }
    });

    $("#content-root").fadeIn('slow');

}
comments_handler = {

    properties: {
        title: 'Comments',
        singular: 'comment',
        ajaxURL: '../admin/config/data.php/comments/'
    },

    columns: [
    {
        "data": null,
        "defaultContent": "<button class='btn btn-xs'>EDIT</button>"
    },
    {
        "data": "sid",
        "render": function(data, type, full, meta) {
            if (data) {
                var view = '<a target="_blank" href="../#/view/' + data + '">' + data + '</a>';
                return view;
            } else {
                return '';
            }
        }
    },
    {"data": "name"},
    {"data": "comment"},
    {
        "data": "created",
        "render": function(data, type, full, meta) {
            if (data) {
                return moment.unix(data).format('MM-DD-YYYY');
            } else {
                return '';
            }
        }
    },
    {"data": "uip"},
    {"data": "uipp"}
    ],

    onLoad: function() {
        var self = this;
        var dataSet = [];


        /*Buttons*/

        new $.fn.dataTable.Buttons(table, {
            buttons: [{
                    text: 'Delete',
                    className: 'btn-danger',
                    action: function() {
                        self.deleteEntry();
                    }
                }, {
                    extend: 'collection',
                    text: 'Export',
                    buttons: ['copy', 'excel', 'pdf']
                },
                'selectNone'
            ]
        });

        table.buttons().container()
            .appendTo($('.col-sm-6:eq(0)', table.table().container()));
    },

    getSelected: function() {

        var ids = table.rows({
            selected: true
        }).ids().toArray();
        return ids.join(',');

        // table.rows({ selected: true }).every( function () {
        //     table.cell(this, 1).data('as').invalidate().draw();
        // });
    },

    deleteEntry: function() {
        var self = this;

        $('.modal-body').empty();
        $('.modal-submit').off('click');
        $('.modal-title').text('Are you sure you want to delete?');
        $('.modal-submit').text('Delete');
        $('#myModal').modal();


        $('.modal-submit').click(function(event) {
            $.ajax({
                type: "DELETE",
                url: self.properties.ajaxURL + self.getSelected(),
                crossDomain: false,
                success: function(json) {
                    if (json.error) {
                        alert("There was an error.");
                    } else {
                        table.ajax.reload(null, false);
                        $('#myModal').modal('hide');
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    alert("There was an error.");
                }
            });
        });


    },

    editEntry: function(data) {

        var self = this;

        $('.modal-body').empty();
        $('.modal-submit').off('click');
        $('.modal-title').text('Edit ' + self.properties.singular);

        $(".form").clone().removeClass("hidden").appendTo(".modal-body");
        //Set Data

        $('.modal-body input[name=name]').val(data.name);
        $('.modal-body textarea[name=comment]').val(data.comment);


        $('#myModal').modal();

        $('.modal-submit').click(function(event) {
            $('.modal-submit').prop('disabled', true);
            var formData = {
                'name': $('input[name=name]').val(),
                'comment': $('.modal-body textarea[name=comment]').val()

            };

            $.ajax({
                type: "PUT",
                url: self.properties.ajaxURL + data.id,
                crossDomain: false,
                data: formData,
                success: function(json) {
                    if (json.error) {
                        alert("There was an error.");
                    } else {
                        $('#myModal').modal('hide');
                        table.ajax.reload(null, false);
                    }
                    $('.modal-submit').prop('disabled', false);
                },
                error: function(xhr, textStatus, errorThrown) {
                    alert("There was an error.");
                    $('.modal-submit').prop('disabled', false);
                }
            });
        });

    },

    events: function() {

        var self = this;
        self.onLoad();

        /*On Button Click*/

        $('#datatable tbody').on('click', 'button', function() {
            var data = table.row($(this).parents('tr')).data();
            self.editEntry(data);

        });

    }
}
likes_handler = {

    properties: {
        title: 'Individual Votes',
        singular: 'vote',
        ajaxURL: '../admin/config/data.php/likes/'
    },

    columns: [
    {
        "data": "sid",
        "render": function(data, type, full, meta) {
            if (data) {
                var view = '<a target="_blank" href="../#/view/' + data + '">' + data + '</a>';
                return view;
            } else {
                return '';
            }
        }
    },
    {"data": "type"},
    {
        "data": "created",
        "render": function(data, type, full, meta) {
            if (data) {
                return moment.unix(data).format('MM-DD-YYYY');
            } else {
                return '';
            }
        }
    },
    {"data": "uip"},
    {"data": "uipp"}
    ],

    onLoad: function() {
        var self = this;
        var dataSet = [];


        /*Buttons*/

        new $.fn.dataTable.Buttons(table, {
            buttons: [{
                    text: 'Delete',
                    className: 'btn-danger',
                    action: function() {
                        self.deleteEntry();
                    }
                }, {
                    extend: 'collection',
                    text: 'Export',
                    buttons: ['copy', 'excel', 'pdf']
                },
                'selectNone'
            ]
        });

        table.buttons().container()
            .appendTo($('.col-sm-6:eq(0)', table.table().container()));
    },

    getSelected: function() {

        var ids = table.rows({
            selected: true
        }).ids().toArray();
        return ids.join(',');

        // table.rows({ selected: true }).every( function () {
        //     table.cell(this, 1).data('as').invalidate().draw();
        // });
    },

    deleteEntry: function() {
        var self = this;

        $('.modal-body').empty();
        $('.modal-submit').off('click');
        $('.modal-title').text('Are you sure you want to delete?');
        $('.modal-submit').text('Delete');
        $('#myModal').modal();


        $('.modal-submit').click(function(event) {
            $.ajax({
                type: "DELETE",
                url: self.properties.ajaxURL + self.getSelected(),
                crossDomain: false,
                success: function(json) {
                    if (json.error) {
                        alert("There was an error.");
                    } else {
                        table.ajax.reload(null, false);
                        $('#myModal').modal('hide');
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    alert("There was an error.");
                }
            });
        });


    },

    editEntry: function(data) {

        var self = this;

        $('.modal-body').empty();
        $('.modal-submit').off('click');
        $('.modal-title').text('Edit ' + self.properties.singular);

        $(".form").clone().removeClass("hidden").appendTo(".modal-body");
        //Set Data

        $('.modal-body input[name=name]').val(data.name);
        $('.modal-body textarea[name=comment]').val(data.comment);


        $('#myModal').modal();

        $('.modal-submit').click(function(event) {
            $('.modal-submit').prop('disabled', true);
            var formData = {
                'name': $('input[name=name]').val(),
                'comment': $('.modal-body textarea[name=comment]').val()

            };

            $.ajax({
                type: "PUT",
                url: self.properties.ajaxURL + data.id,
                crossDomain: false,
                data: formData,
                success: function(json) {
                    if (json.error) {
                        alert("There was an error.");
                    } else {
                        $('#myModal').modal('hide');
                        table.ajax.reload(null, false);
                    }
                    $('.modal-submit').prop('disabled', false);
                },
                error: function(xhr, textStatus, errorThrown) {
                    alert("There was an error.");
                    $('.modal-submit').prop('disabled', false);
                }
            });
        });

    },

    events: function() {

        var self = this;
        self.onLoad();

        /*On Button Click*/

        $('#datatable tbody').on('click', 'button', function() {
            var data = table.row($(this).parents('tr')).data();
            self.editEntry(data);

        });

    }
}
signups_handler = {

    properties: {
        title: 'Comments',
        singular: 'comment',
        ajaxURL: '../admin/config/data.php/signups/'
    },

    columns: [
    {
        "data": "id",
    },
    {"data": "name"},
    {"data": "email"},
    {
        "data": "created",
        "render": function(data, type, full, meta) {
            if (data) {
                return moment.unix(data).format('MM-DD-YYYY');
            } else {
                return '';
            }
        }
    },
    {"data": "uip"},
    {"data": "uipp"}
    ],

    onLoad: function() {
        var self = this;
        var dataSet = [];


        /*Buttons*/

        new $.fn.dataTable.Buttons(table, {
            buttons: [{
                    text: 'Delete',
                    className: 'btn-danger',
                    action: function() {
                        self.deleteEntry();
                    }
                }, {
                    extend: 'collection',
                    text: 'Export',
                    buttons: ['copy', 'excel', 'pdf']
                },
                'selectNone'
            ]
        });

        table.buttons().container()
            .appendTo($('.col-sm-6:eq(0)', table.table().container()));
    },

    getSelected: function() {

        var ids = table.rows({
            selected: true
        }).ids().toArray();
        return ids.join(',');

        // table.rows({ selected: true }).every( function () {
        //     table.cell(this, 1).data('as').invalidate().draw();
        // });
    },

    deleteEntry: function() {
        var self = this;

        $('.modal-body').empty();
        $('.modal-submit').off('click');
        $('.modal-title').text('Are you sure you want to delete?');
        $('.modal-submit').text('Delete');
        $('#myModal').modal();


        $('.modal-submit').click(function(event) {
            $.ajax({
                type: "DELETE",
                url: self.properties.ajaxURL + self.getSelected(),
                crossDomain: false,
                success: function(json) {
                    if (json.error) {
                        alert("There was an error.");
                    } else {
                        table.ajax.reload(null, false);
                        $('#myModal').modal('hide');
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    alert("There was an error.");
                }
            });
        });


    },

    events: function() {

        var self = this;
        self.onLoad();


    }
}
suggestions_handler = {

    properties: {
        title: 'Suggestions',
        singular: 'Suggestion',
        ajaxURL: '../admin/config/data.php/suggestions/'
    },

    columns: [
    {
        "data": null,
        "defaultContent": "<button class='btn btn-xs'>EDIT</button>"
    },
    {
        "data": "id",
        "render": function(data, type, full, meta) {
            if (data) {
                var view = '<a target="_blank" href="../#/view/' + data + '">' + data + '</a>';
                return view;
            } else {
                return '';
            }
        }
    },
    {"data": "name"},
    {"data": "comment"},
    {
        "data": "photo",
        "render": function(data, type, full, meta) {
            if (data) {
                return '<a target="_blank" href="../img/uploads/' + data + '">View</a>';
            } else {
                return '';
            }
        }
    }, 
    {"data": "like"},
    {"data": "dislike"},
    {"data": "category"},
    {"data": "type"},
    {"data": "geometry"},
    {
        "data": "created",
        "render": function(data, type, full, meta) {
            if (data) {
                return moment.unix(data).format('MM-DD-YYYY');
            } else {
                return '';
            }
        }
    },
    {"data": "uip"},
    {"data": "uipp"}
    ],

    onLoad: function() {
        var self = this;
        var dataSet = [];


        /*Buttons*/

        new $.fn.dataTable.Buttons(table, {
            buttons: [{
                    text: 'Delete',
                    className: 'btn-danger',
                    action: function() {
                        self.deleteEntry();
                    }
                }, {
                    extend: 'collection',
                    text: 'Export',
                    buttons: ['copy', 'excel', 'pdf', {
                    text: 'KML',
                    action: function() {
                        window.open("config/kml.php/suggestions");
                    }
                }, {
                    text: 'GEOJSON',
                    action: function() {
                        window.open("config/geojson.php/suggestions");
                    }
                }]
                },
                'selectNone',

            ]
        });

        table.buttons().container()
            .appendTo($('.col-sm-6:eq(0)', table.table().container()));
    },

    getSelected: function() {

        var ids = table.rows({
            selected: true
        }).ids().toArray();
        return ids.join(',');

        // table.rows({ selected: true }).every( function () {
        //     table.cell(this, 1).data('as').invalidate().draw();
        // });
    },

    deleteEntry: function() {
        var self = this;

        $('.modal-body').empty();
        $('.modal-submit').off('click');
        $('.modal-title').text('Are you sure you want to delete?');
        $('.modal-submit').text('Delete');
        $('#myModal').modal();


        $('.modal-submit').click(function(event) {
            $.ajax({
                type: "DELETE",
                url: self.properties.ajaxURL + self.getSelected(),
                crossDomain: false,
                success: function(json) {
                    if (json.error) {
                        alert("There was an error.");
                    } else {
                        table.ajax.reload(null, false);
                        $('#myModal').modal('hide');
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    alert("There was an error.");
                }
            });
        });


    },

    editEntry: function(data) {

        var self = this;

        $('.modal-body').empty();
        $('.modal-submit').off('click');
        $('.modal-title').text('Edit ' + self.properties.singular);

        $(".form").clone().removeClass("hidden").appendTo(".modal-body");
        //Set Data

        $('.modal-body input[name=name]').val(data.name);
        $('.modal-body textarea[name=comment]').val(data.comment);


        $('#myModal').modal();

        $('.modal-submit').click(function(event) {
            $('.modal-submit').prop('disabled', true);
            var formData = {
                'name': $('input[name=name]').val(),
                'comment': $('.modal-body textarea[name=comment]').val()

            };

            $.ajax({
                type: "PUT",
                url: self.properties.ajaxURL + data.id,
                crossDomain: false,
                data: formData,
                success: function(json) {
                    if (json.error) {
                        alert("There was an error.");
                    } else {
                        $('#myModal').modal('hide');
                        table.ajax.reload(null, false);
                    }
                    $('.modal-submit').prop('disabled', false);
                },
                error: function(xhr, textStatus, errorThrown) {
                    alert("There was an error.");
                    $('.modal-submit').prop('disabled', false);
                }
            });
        });

    },

    events: function() {

        var self = this;
        self.onLoad();

        /*On Button Click*/

        $('#datatable tbody').on('click', 'button', function() {
            var data = table.row($(this).parents('tr')).data();
            self.editEntry(data);

        });

    }
}
survey_handler = {

    properties: {
        title: 'Surveys',
        singular: 'survey',
        ajaxURL: '../admin/config/data.php/survey/'
    },

    columns: [
    {
        "data": "id",
    },
    {"data": "zipcode"},
    {"data": "age"},
    {"data": "gender"},
    {"data": "race"},
    {"data": "howoften"},
	{"data": "bikingrelationship"},
    {
        "data": "created",
        "render": function(data, type, full, meta) {
            if (data) {
                return moment.unix(data).format('MM-DD-YYYY');
            } else {
                return '';
            }
        }
    },
    {"data": "uip"},
    {"data": "uipp"}
    ],

    onLoad: function() {
        var self = this;
        var dataSet = [];


        /*Buttons*/

        new $.fn.dataTable.Buttons(table, {
            buttons: [{
                    text: 'Delete',
                    className: 'btn-danger',
                    action: function() {
                        self.deleteEntry();
                    }
                }, {
                    extend: 'collection',
                    text: 'Export',
                    buttons: ['copy', 'excel', 'pdf']
                },
                'selectNone'
            ]
        });

        table.buttons().container()
            .appendTo($('.col-sm-6:eq(0)', table.table().container()));
    },

    getSelected: function() {

        var ids = table.rows({
            selected: true
        }).ids().toArray();
        return ids.join(',');

        // table.rows({ selected: true }).every( function () {
        //     table.cell(this, 1).data('as').invalidate().draw();
        // });
    },

    deleteEntry: function() {
        var self = this;

        $('.modal-body').empty();
        $('.modal-submit').off('click');
        $('.modal-title').text('Are you sure you want to delete?');
        $('.modal-submit').text('Delete');
        $('#myModal').modal();


        $('.modal-submit').click(function(event) {
            $.ajax({
                type: "DELETE",
                url: self.properties.ajaxURL + self.getSelected(),
                crossDomain: false,
                success: function(json) {
                    if (json.error) {
                        alert("There was an error.");
                    } else {
                        table.ajax.reload(null, false);
                        $('#myModal').modal('hide');
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    alert("There was an error.");
                }
            });
        });


    },

    events: function() {

        var self = this;
        self.onLoad();


    }
}
//# sourceMappingURL=app.js.map