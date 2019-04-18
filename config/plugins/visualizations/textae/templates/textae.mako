<!DOCTYPE HTML>

<%
    import os
    root = h.url_for( '/' )
    json = hda.get_raw_data()
    path = hda.get_file_name()
%>

<html>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <title>${hda.name} | ${visualization_name}</title>
    <link href="https://textae.pubannotation.org/lib/css/textae.min.css" rel="stylesheet"></link>
    <script src="https://textae.pubannotation.org/lib/textae.min.js"></script>

    <script>
        $(document).ready(function() {
            $('#save').on('click', function(e){
                var text = $('#textae').html()
                $('#output').text(text)
                $('#output_div').show()
            })
            $('#hide').on('click', function (e) {
                $('#output_div').hide()
            })
        })
    </script>
</head>


<body>
    <h1>TextAE</h1>
    <p>The annotation editor from <a targt="_blank" href="http://textae.pubannotation.org">PubAnnotation</a></p>
    <table>
        <tr>
            <th>Name</th>
            <td>${hda.name}</td>
        </tr>
        <tr>
            <th>Path</th>
            <td>${hda.get_file_name()}</td>
        </tr>
        <tr>
            <th>Dataset</th>
            <td>${hda.dataset}</td>
        </tr>
    </table>
    <!--
    <div id="textae" class="textae-editor">
        { "text": "Hello World", "denotations": [ {"id":"t1","obj:"UH", ["begin":0,"end":5]}, {"id":"t2","obj":"NN",["begin":6,"end":11]}] }
    </div>
    <div id="textae" class="textae-editor" mode="edit">${json}</div>
    -->
    <p>Loading data from ${path}</p>
    <div id="textae" class="textae-editor" mode="edit" target="${path}">${json}</div>
    <button id="save">Save</button>
    <div id="output_div" style="display: none">
        <p id="output">Yay! I'm visible.</p>
        <button id="hide">Hide</button>
    </div>
<footer>
    <p style="text-align:center">Copyright &copy; 2019 The Language Applications Grid - All Rights Reserved</p>
</footer>
</body>
</html>
