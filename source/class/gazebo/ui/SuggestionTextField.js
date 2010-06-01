/*
   Copyright and License: see LICENSE file

   Contributors:
	   * Joachim Baran
 */

/* ************************************************************************

#asset(gazebo/*)

************************************************************************ */

/**
 * A textfield with suggestions popping up as text is entered.
 */
qx.Class.define("gazebo.ui.SuggestionTextField",
{
  extend : qx.ui.container.Composite,

  /**
   * @param dataSource {String} Resource that is used for the pop-ups.
   */
  construct : function(listeners)
  {
    this.base(arguments);

    this.rpcRunning = null;
    this.openAll = false;

    this.setLayout(new qx.ui.layout.VBox(0));
    
    this.textField = new qx.ui.form.TextField();

    // Bugfix for qooxdoo 1.0.1 and Chrome/Safari on OSX:
    this.textField.getContentElement().setAttribute("spellcheck", "false");

    this.textField.setMinWidth(400);
    this.textField.setLiveUpdate(true);
    this.textField.addListener("input", this.generateSuggestions, this);
    this.textField.addListener("keypress", function(keyEvent) {
        if (keyEvent.getKeyIdentifier() == "Down" ||
            keyEvent.getKeyIdentifier() == "PageDown") {
          if (this.suggestionTree.isSelectionEmpty()) {
            var rootNode = this.suggestionTree.getRoot();
            if (rootNode.hasChildren()) {
              // Uses a reference to the tree items, hence it is quick.
              var treeItems = rootNode.getChildren();
              this.suggestionTree.setSelection([ treeItems[0] ]);
            }
          }
          this.suggestionTree.activate();
        }
    }, this);

    this.suggestionTree = new qx.ui.tree.Tree();
    this.suggestionTree.setMinHeight(303);
    this.suggestionTree.setHideRoot(true);
    this.suggestionTree.hide();
    this.suggestionTree.setOpacity(0);
    this.suggestionTree.addListener("appear", function() {
        animation = new qx.fx.effect.core.Fade(this.suggestionTree.getContainerElement().getDomElement());
        animation.set({
          from : 0.0,
          to : 1.0,
          duration : 0.8
         });
        animation.start();
      }, this);
    // Fading out does not seem to work.
//    this.suggestionTree.addListener("disappear", function() {
//        animation = new qx.fx.effect.core.Fade(this.suggestionTree.getContainerElement().getDomElement());
//        animation.set({
//          from : 1.0,
//          to : 0.0,
//          duration : 0.8
//         });
//        animation.start();
//      }, this);

    this.treeRoot = new qx.ui.tree.TreeFolder("Root");
    this.treeRoot.setOpen(true);
    this.suggestionTree.setRoot(this.treeRoot);

    this.add(this.textField);
    this.add(this.suggestionTree);

    // Install custom listeners:
    var listener;
    if (listeners['onKeyPress']) {
      listener = listeners['onKeyPress'];
      this.textField.addListener("keypress", listener['call'], listener['context']);
    }
    if (listeners['onInput']) {
      listener = listeners['onInput'];
      this.textField.addListener("input", listener['call'], listener['context']);
    }
  },

  members :
  {
    focus : function()
    {
      this.textField.focus();
    },

    /**
     * @param dataEvent {qx.event.type.Data} Result of the database query.
     */
    generateSuggestions : function(dataEvent)
    {
      var rpc = new qx.io.remote.Rpc();
      rpc.setTimeout(2000); // 2sec time-out, arbitrarily chosen.
      rpc.setUrl(gazebo.Application.getServerURL());
      rpc.setServiceName("gazebo.cgi");

      var textValue = dataEvent.getData();

      if (!textValue || textValue.length == 0) {
        this.suggestionTree.hide();
        this.suggestionTree.setOpacity(0);
        this.treeRoot.removeAll();
        return;
      }

      var options;
      if (this.openAll) {
        options = { count : true }; // Count is not needed here, but simplifies code below.
      } else {
        options = { count : true, limit : 14 }; // Some Firefox/Windows add a scrollbar for >13?
      }

      var that = this;
      this.rpcRunning = rpc.callAsync(
        function(result, ex, id)
        {
          if (that.rpcRunning && that.rpcRunning.getSequenceNumber() == id) {
            that.debug("This: " + this + " That: " + that + " RPC: " + that.rpcRunning +
               " Seq: " + that.rpcRunning.getSequenceNumber() + " Id: " + id);
            that.debug("treeRoot: " + that.treeRoot);
            that.openAll = false; // Always default back to a short list of suggestions.
            that.treeRoot.removeAll();

            var folder, file;

            if (!result) {
              return;
            }

            if (result.length == 0) {
              file = new qx.ui.tree.TreeFile();
              file.addWidget(
                new qx.ui.basic.Label(
                  "(no matches)"
                ).set({ appearance: "annotation", rich: true }));
              that.treeRoot.add(file);
              return;
            }

            count = result[0];
            result = result[1];

            for (i = 0; i < result.length; i++) {
              var abstraction = result[i][0];
              var matches = result[i][1];
              if (result[i][1] > 1) {
                folder = new qx.ui.tree.TreeFolder();
                folder.addState("small"); // Small icons.
                folder.setOpenSymbolMode("always");
                folder.addListener("changeOpen", that.openFolder, that);

                folder.addSpacer();
                folder.addOpenButton();
                folder.addLabel(abstraction);
                folder.addWidget(new qx.ui.core.Spacer(), {flex: 1});
                folder.addWidget(
                  new qx.ui.basic.Label(
                    "(" + matches + " matches)"
                  ).set({ appearance: "annotation", rich: true }));

                that.treeRoot.add(folder);
              } else  {
                if (result[i].length > 2) {
                  file = new qx.ui.tree.TreeFile();
                  file.addState("small"); // Small icons.

                  file.addSpacer();
                  file.addLabel(abstraction);
                  file.addWidget(new qx.ui.core.Spacer(), {flex: 1});
                  for (j = 2; j < result[i].length; j++) {
                    var customAnnotation = result[i][j];
                    if (j > 2) {
                      file.addWidget(new qx.ui.basic.Label(
                        ",&nbsp;"
                      ).set({ appearance: "annotation", rich: true}));
                    }
                    file.addWidget(
                      new qx.ui.basic.Label(
                        customAnnotation
                      ).set({ appearance: "annotation", rich: true }));
                  }
                } else {
                  file = new qx.ui.tree.TreeFile(abstraction);
                  file.addState("small"); // Small icons.
                }

                that.treeRoot.add(file);
              }
            }

            moreMatches = count[0] - result.length;

            if (moreMatches > 0) {
              file = new qx.ui.tree.TreeFile(" ");
              file.addWidget(
                new qx.ui.basic.Label(
                  "(" + moreMatches + " more matches - click to view)"
                ).set({ appearance: "annotation", rich: true }));
              file.addListener("changeOpen", function(dataEvent) {
                that.openAll = true;
                var newDataEvent = new qx.event.type.Data().init(that.textField.getValue());
                that.generateSuggestions(newDataEvent);
              }, that);
              file.setOpenSymbolMode("always");
              that.treeRoot.add(file);
            }

            that.suggestionTree.show();
          }
        },
        "query",
        options,
        "fb2010_03",
        [ "*" ],
        [ "x_searchables_" + ( textValue.length - 1 ) ],
        "searchable like ?",
        [ textValue + "%" ]
      );
    },

    openFolder : function(folderEvent) {
      var folder;
      if (folderEvent.getData()) {
        // Folder opened.
        if (this.suggestionTree.isSelectionEmpty()) {
          // No folder selected. Weird. Why did we get an event then?
          return;
        }

        var selectedItems = this.suggestionTree.getSelection();
        folder = selectedItems[0];

        if (folder.hasChildren()) {
          // We already populated the folder.
          return;
        }
      
      var rpc = new qx.io.remote.Rpc();
      rpc.setTimeout(5000); // 5sec time-out, arbitrarily chosen.
      rpc.setUrl(gazebo.Application.getServerURL());
      rpc.setServiceName("gazebo.cgi");

      var textValue = folder.getLabel();
      
      if (!textValue) {
        return;
      }

      // Workaround: For some reason, '+' does not make it to the server.
      textValue = textValue.replace("@", "@@");
      textValue = textValue.replace("+", "@P");
      this.debug("Searching for: " + textValue);

      var that = this;
      this.rpcRunning = rpc.callAsync(
        function(result, ex, id)
        {
          if (that.rpcRunning && that.rpcRunning.getSequenceNumber() == id) {

            if (!result) {
              // No result.
              return;
            }

            var childFolder, childFile;
            for (i = 0; i < result.length; i++) {
              if (result[i][1].match(/\.\.\./)) {
                childFolder = new qx.ui.tree.TreeFolder(result[i][1]);
                childFolder.addState("small"); // Small icons.
                childFolder.setOpenSymbolMode("always");
                childFolder.addListener("changeOpen", that.openFolder, that);
                folder.add(childFolder);
              } else  {
                childFile = new qx.ui.tree.TreeFile(result[i][1]);
                childFile.addState("small");
                folder.add(childFile);
              }
            }
            that.suggestionTree.show();
          }
        },
        "query",
        {},
        "fb2010_03",
        [ "abstraction", "concretisation" ],
        [ "x_fast_transitions" ],
        "abstraction == ? ORDER BY concretisation ASC",
        [ textValue ]
      );
      }
    }
  }
});