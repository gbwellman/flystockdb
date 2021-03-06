/*
   Copyright and License: see LICENSE file

   Contributors:
	   * Joachim Baran
 */

/**
 * A container that holds multiple shopping baskets.
 */
qx.Class.define("gazebo.ui.BasketContainer",
{
  extend : qx.ui.container.Composite,

  statics :
  {
    EMPTY_BASKET_ITEM: 0,
    STICKY_BASKET_ITEM: 1,
    LIBERAL_BASKET_ITEM: 2
  },

  construct : function(parameters, listeners, overrides)
  {
    this.base(arguments);

    var populate = parameters['populate'];
    var titles = parameters['titles'];
    var decorations = parameters['decorations'];
    var width = parameters['basketContainerWidth'] ? parameters['basketContainerWidth'] : 866;
    var compact = parameters['compact'];

    this.labels = parameters['labels'];
    this.basketMinHeight = parameters['basketMinHeight'] ? parameters['basketMinHeight'] : 250;

    this.draggableItems = parameters['draggableItems'];
    this.dragAndDropFlavour = parameters['dragAndDropFlavour'] ? parameters['dragAndDropFlavour'] : 'item';

    this.basketItemSpacing = 0;
    this.basketItemDNDSpacing = 0;
    this.itemTopMargin = 4;

    // Install overrides (needed when populating baskets):
    if (overrides['makeEmptyBasketLabel']) {
      this.makeEmptyBasketLabel = overrides['makeEmptyBasketLabel'];
    }

    this.setLayout(new qx.ui.layout.VBox(10));

    this.basketComposite = new qx.ui.container.Composite();

    this.basketComposite.setLayout(new qx.ui.layout.Flow(5, 0));
    this.basketComposite.setAllowStretchX(false, false);
    this.basketComposite.setWidth(width);

    this.add(this.basketComposite);

    if (populate) {
      for (var i = 0; i < populate; i++) {
        var basketTitle = titles && titles.length > 0 ? titles[i] : null;

        var decoration = null;
        if (decorations && i < decorations.length) {
          decoration = decorations[i];
        }

        this.addBasket(basketTitle, decoration);
      }
      for (i = 0; i < populate; i++) {
        var emptyBasketLabel = this.makeEmptyBasketLabel(i);

        if (emptyBasketLabel) {
          this.addFlavouredBasketItem(i, emptyBasketLabel, gazebo.ui.BasketContainer.EMPTY_BASKET_ITEM);
        }
      }
    }

    var that = this;
    
    // Needs fixing/repositioning if populate is not set.
    if (this.draggableItems) {
      var trashcan = new qx.ui.basic.Atom(null, 'qx/icon/Tango/32/places/user-trash.png');

      trashcan.setDroppable(true);
      
      trashcan.addListener("dragover",
        function(e) {
          if (!e.supportsType(that.dragAndDropFlavour)) {
            e.preventDefault();
          }
          trashcan.setIcon('qx/icon/Tango/32/places/user-trash-full.png');
        });
      trashcan.addListener("dragleave",
        function(e) {
          if (!e.supportsType(that.dragAndDropFlavour)) {
            e.preventDefault();
          }
          trashcan.setIcon('qx/icon/Tango/32/places/user-trash.png');
        });
      trashcan.addListener("drop",
        function(e) {
          if (!e.supportsType(that.dragAndDropFlavour)) {
            e.preventDefault();
          }
          trashcan.setIcon('qx/icon/Tango/32/places/user-trash.png');

          var item = e.getData(that.dragAndDropFlavour);
          var itemAddress = that.locateItem(null, item);

          that.removeBasketItem(itemAddress[1], item.getLayoutParent());
        });

      var trashComposite = new qx.ui.container.Composite();

      trashComposite.setLayout(new qx.ui.layout.VBox(10).set({
        alignY: 'bottom'
      }));
      trashComposite.setMinHeight(this.basketMinHeight);
      trashComposite.add(trashcan);
      
      this.basketComposite.add(trashComposite);
    }

    var footerContainer = new qx.ui.container.Composite();
    footerContainer.setLayout(new qx.ui.layout.HBox(10).set({
      alignY: 'middle'
    }));

    if (parameters['footer']) {
      this.footer = new qx.ui.basic.Label().set({
        value: parameters['footer'],
        selectable: true,
        rich: true,
        appearance: 'annotation'
      });

      footerContainer.add(this.footer);
    }

    this.add(footerContainer);

    if (listeners['onBasketChange']) {
      listener = listeners['onBasketChange'];
      this.addListener('onBasketChangeRelay', listener['call'], listener['context']);
    }
  },

  members:
  {
    setFooter : function(text)
    {
      this.footer.setValue(text);
    },

    addBasket : function(title, decoration)
    {
      var itemContainer = new qx.ui.groupbox.GroupBox();

      if (title == null || title.length == 0)
        itemContainer = new gazebo.ui.FauxGroupBox();

      if (decoration) {
        itemContainer.getChildrenContainer().setDecorator(decoration);
      }

      // TODO Bloody hack.. damn it!
      if (!this.basketNo)
        this.basketNo = 1;
      switch(this.basketNo) {
      case 1:
      case 7:
        itemContainer.getChildrenContainer().setBackgroundColor('#ffffbb');
        break;
      case 2:
      case 8:
        itemContainer.getChildrenContainer().setBackgroundColor('#ddffbb');
        break;
      case 3:
      case 9:
        itemContainer.getChildrenContainer().setBackgroundColor('#bbffbb');
        break;
      case 4:
      case 10:
        itemContainer.getChildrenContainer().setBackgroundColor('#bbffdd');
        break;
      case 5:
        itemContainer.getChildrenContainer().setBackgroundColor('#bbffff');
        break;
      case 6:
        itemContainer.getChildrenContainer().setBackgroundColor('#bbddff');
        break;
      }
      this.basketNo++;

      if (title && title.length > 0) {
        itemContainer.setLegend(title);
      }

      itemContainer.setLayout(new qx.ui.layout.VBox(this.basketItemSpacing));
      itemContainer.setMinWidth(140);
      itemContainer.setMinHeight(this.basketMinHeight);

      if (this.draggableItems) {
        itemContainer.setDroppable(true);

        itemContainer.myPreviewItems = new Array();

        var that = this;
        itemContainer.addListener("drop",
          function(e) {
            var item = e.getData(that.dragAndDropFlavour);

            itemContainer.setBackgroundColor(null);

            var originalContents = itemContainer.theOriginalContents;
            itemContainer.removeAll();
            for (i = 0; i < originalContents.length; i++) {
              originalContents[i].setMarginTop(that.itemTopMargin);
              itemContainer.add(originalContents[i])
            }
            itemContainer.theOriginalContents = null;

            var itemAddress = that.locateItem(itemContainer, item);

            var thisBasket = itemAddress[0];
            var location = itemAddress[1];

            if (thisBasket >= 0 && location >= 0) {
              that.removeBasketItem(location, item.getLayoutParent());

              if (itemContainer.myDropHint) {
                itemContainer.myPreviewItem.getChildren()[0].setDecorator('drop-box');
                that.addBasketItemBefore(thisBasket, item, itemContainer.myDropHint);
              } else {
                item.basketModel = thisBasket;
                that.addBasketItem(thisBasket, item, null);
              }
            }
          }
        );

        itemContainer.addListener("dragover",
          function(e) {
            if (!e.supportsType(that.dragAndDropFlavour)) {
              e.preventDefault();
            } else {
              itemContainer.myDropHint = null;
              //itemContainer.setDecorator('button-box-hovered');
              itemContainer.setBackgroundColor('#6694E3');
              itemContainer.getLayout().setSpacing(that.basketItemDNDSpacing);

              var contents = itemContainer.getChildren();

              for (i = 0; i < contents.length + 1; i++) {
                var separatorItem = new qx.ui.menu.Separator();
                separatorItem.setHeight(1);
                separatorItem.setAllowStretchX(true, true);
                separatorItem.setDecorator('drop-box');

                separatorItem.setPadding(1, 0, 1, 0);
                separatorItem.setMargin(0, 0, 0, 0);

                var previewItem = new qx.ui.container.Composite();
                previewItem.setLayout(new qx.ui.layout.VBox(0));
                previewItem.setAllowStretchX(true, true);
                previewItem.add(separatorItem);

                var thisItemContainer = itemContainer;
                previewItem.addListener("mouseover",
                  function(e) {
                    var currentContents = thisItemContainer.getChildren();
                    for (j = 0; j < currentContents.length - 1; j++) {
                      thisItemContainer.myDropHint = null;
                      if (currentContents[j] == this) {
                        thisItemContainer.myPreviewItem = this;
                        thisItemContainer.myDropHint = currentContents[j + 1];
                        break;
                      }
                    }
                    this.getChildren()[0].setDecorator('drop-box-hovered');
                  },
                  previewItem
                );
                previewItem.addListener("mouseout",
                  function(e) {
                    thisItemContainer.myDropHint = null;
                    this.getChildren()[0].setDecorator('drop-box');
                  },
                  previewItem
                );

                itemContainer.myPreviewItems.push(previewItem);
              }

              // Make a copy in case Qooxdoo eventually gives us the real thing.
              originalContents = new Array();
              for (i = 0; i < contents.length; i++) {
                originalContents.push(contents[i]);
              }

              // Fixes Issue #5.
              // TODO Figure out WHY this actually works.
              if (itemContainer.theOriginalContents) {
                return;
              }
              itemContainer.theOriginalContents = originalContents;

              for (i = 0; i < originalContents.length; i++) {
                originalContents[i].setMarginTop(0);
                itemContainer.addBefore(itemContainer.myPreviewItems[i], originalContents[i]);
              }

              itemContainer.add(itemContainer.myPreviewItems[itemContainer.myPreviewItems.length - 1]);
            }
          }
        );

        itemContainer.addListener("dragleave",
          function(e) {
            //itemContainer.setDecorator(null);
            itemContainer.setBackgroundColor(null);
            itemContainer.getLayout().setSpacing(that.basketItemSpacing);
            var originalContents = itemContainer.theOriginalContents;
            itemContainer.removeAll();
            for (i = 0; i < originalContents.length; i++) {
              originalContents[i].setMarginTop(that.itemTopMargin);
              itemContainer.add(originalContents[i])
            }
            itemContainer.theOriginalContents = null;
          }
        );
      }

      this.basketComposite.add(itemContainer, { flex: 0 });
    },

    locateItem : function(itemContainer, item)
    {
      var thisBasket = -1;
      var location = -1;

      var baskets = this.basketComposite.getChildren();

      for (var i = 0; i < baskets.length; i++) {
        var contents = this.getBasketItems(i);

        if (baskets[i] == itemContainer) {
          thisBasket = i;
        }

        for (var j = 0; j < contents.length; j++) {
          if (contents[j] == item) {
            location = i;
            break;
          }
        }
      }

      return [ thisBasket, location ];
    },

    removeAllBasketItems : function()
    {
      var baskets = this.basketComposite.getChildren();

      for (var i = 0; i < baskets.length; i++) {
        var contents = this.getBasketItems(i);

        for (var j = 0; j < contents.length; j++) {
          // TODO I am not entirely sure why null is part of the array.
          if (contents[j]) {
            this.removeBasketItem(i, contents[j].getLayoutParent());
          }
        }
      }
    },

    getBasketItems : function(index)
    {
      var baskets = this.basketComposite.getChildren();
      var itemContainer = baskets[index];
      var items = new Array();
      
      var contents = itemContainer.getChildren();

      if (!contents) {
        return items;
      }

      for (var i = 0; i < contents.length; i++) {
        //this.debug("ITEM: " + i + " " + contents[i] + " - " + contents[i].itemReference);
        items.push(contents[i].itemReference);
      }

      return items;
    },

    setBasketItem : function(index, item)
    {
      var baskets = this.basketComposite.getChildren();
      var itemContainer = baskets[index];

      itemContainer.removeAll();
      this.addBasketItem(index, item);
    },

    addBasketItem : function(index, item, weight)
    {
      this.addFlavouredBasketItem(index, item, gazebo.ui.BasketContainer.LIBERAL_BASKET_ITEM, weight);
    },

    addBasketItemBefore : function(index, item, beforeItem)
    {
      this.addFlavouredBasketItem(index, item, gazebo.ui.BasketContainer.LIBERAL_BASKET_ITEM, null, beforeItem);
    },

    addBasketItemAfter : function(index, item, afterItem)
    {
      this.addFlavouredBasketItem(index, item, gazebo.ui.BasketContainer.LIBERAL_BASKET_ITEM, null, null, afterItem);
    },

    addFlavouredBasketItem : function(index, item, flavor, weight, beforeItem, afterItem)
    {
      var baskets = this.basketComposite.getChildren();
      var itemContainer = baskets[index];

      var contents = itemContainer.getChildren();

      if (contents &&
          contents.length == 1 &&
          contents[0].itemFlavor == gazebo.ui.BasketContainer.EMPTY_BASKET_ITEM) {
        itemContainer.remove(contents[0]);
      }

      this.debug("flavour: " + flavor);
      this.debug("itemContainer: " + itemContainer);
      
      var itemComposite = new qx.ui.container.Composite();
      itemComposite.itemFlavor = flavor;
      itemComposite.itemReference = item;
      itemComposite.setLayout(new qx.ui.layout.HBox(5));

      itemComposite.setMarginTop(this.itemTopMargin);

      var that = this;
      if (flavor != gazebo.ui.BasketContainer.EMPTY_BASKET_ITEM && !this.draggableItems) {
        var controlButton = new qx.ui.basic.Atom(null, "qx/icon/Oxygen/16/categories/development.png");

        controlButton.setWidth(20);
        controlButton.setHeight(20);

        controlButton.addListener('mouseover', function(mouseEvent) {
          this.setDecorator('button-hovered');
        }, controlButton);
        controlButton.addListener('mouseout', function(mouseEvent) {
          this.setDecorator(null);
        }, controlButton);

        controlButton.addListener('click', function(mouseEvent) {
          var popup = new qx.ui.popup.Popup(new qx.ui.layout.VBox(5)).set({
            backgroundColor: "#EEEEEE",
            padding: [2, 4],
            offset : 3,
            offsetBottom : 20
          });

          if (flavor != gazebo.ui.BasketContainer.STICKY_BASKET_ITEM) {
            var currentBasketContents = that.getBasketItems(index);

            var first = false;
            var last = false;

            for (var i = 0; i < currentBasketContents.length; i++) {
              if (currentBasketContents[i] == item && i == 0) {
                first = true;
              }
              if (currentBasketContents[i] == item && i == currentBasketContents.length - 1) {
                last = true;
              }
            }
            //if (currentBasketContents.length);

            if (!first) {
              var up = new qx.ui.basic.Atom("Towards front", 'qx/icon/Oxygen/16/actions/go-up.png');

              up.addListener('click', function() {
                var basketContents = that.getBasketItems(index);
                var previousItem = null;

                popup.hide();

                for (var i = 0; i < basketContents.length; i++) {
                  if (basketContents[i] == item) {
                    if (!previousItem) {
                      return; // Top position already.
                    }
                    var thisComposite = item.getLayoutParent();
                    var previousComposite = previousItem.getLayoutParent();
                    var mightyParent = thisComposite.getLayoutParent();

                    mightyParent.remove(thisComposite);
                    mightyParent.addBefore(thisComposite, previousComposite, 1);

                    return;
                  }
                  previousItem = basketContents[i];
                }
              }, up);

              this.registerHighlighters(up);

              popup.add(up);
            }

            if (!last) {
              var down = new qx.ui.basic.Atom("Towards end", 'qx/icon/Oxygen/16/actions/go-down.png');

              down.addListener('click', function() {
                var basketContents = that.getBasketItems(index);
                var itemSpotted = false;

                popup.hide();

                for (var i = 0; i < basketContents.length; i++) {
                  if (itemSpotted) {
                    var previousComposite = item.getLayoutParent();
                    var thisComposite = basketContents[i].getLayoutParent();
                    var mightyParent = previousComposite.getLayoutParent();

                    mightyParent.remove(previousComposite);
                    mightyParent.addAfter(previousComposite, thisComposite, 1);

                    return;
                  }
                  if (basketContents[i] == item) {
                    itemSpotted = true;
                  }
                }
              }, down);

              this.registerHighlighters(down);

              popup.add(down);
            }

            for (i = 0; i < baskets.length; i++) {
              if (i != index) {
                var icon = that.getDirectionIcon(index, i);
                var moveTo;

                if (that.labels) {
                  moveTo = new qx.ui.basic.Atom("Move to " + that.labels[i], icon);
                } else {
                  moveTo = new qx.ui.basic.Atom("Move to " + baskets[i].getLegend(), icon);
                }
                moveTo.destinationIndex = i;

                moveTo.addListener('click', function() {
                  that.removeBasketItem(index, itemComposite);
                  that.addBasketItem(this.destinationIndex, item);
                  popup.hide();
                  // popup.dispose(); TODO Figure out why this causes a crash.
                }, moveTo);

                this.registerHighlighters(moveTo);

                popup.add(moveTo);
              }
            }
          }

          var remove = new qx.ui.basic.Atom("Remove", 'qx/icon/Oxygen/16/actions/edit-delete.png');

          remove.addListener('click', function () {
            that.removeBasketItem(index, itemComposite);
            popup.hide();
            popup.dispose();
          }, that);

          remove.setRich(true);

          remove.addListener('mouseover', function(mouseEvent) {
            this.setLabel("<span style='color: #5070bf;'>Remove</span>");
          }, remove);

          remove.addListener('mouseout', function(mouseEvent) {
            this.setLabel("Remove");
          }, remove);

          popup.add(remove);
          popup.placeToMouse(mouseEvent);
          popup.show();
        }, this);
        
        itemComposite.add(controlButton, { flex: 0 });
      }

      itemComposite.add(item, { flex: 1 });

      if (!weight) {
        if (beforeItem) {
          itemContainer.addBefore(itemComposite, beforeItem, 1);
          this.debug("COMPOSITE ADDED BEFORE " + beforeItem);
        } else if (afterItem) {
          itemContainer.addAfter(itemComposite, afterItem, 1);
          this.debug("COMPOSITE ADDED AFTER " + afterItem);
        }
        else {
          itemContainer.add(itemComposite, 1);
          this.debug("COMPOSITE ADDED SOMEWHERE");
        }
      } else {
        itemContainer.addAt(itemComposite, weight, 1);
        this.debug("COMPOSITE ADDED AT " + weight);
      }

      this.fireDataEvent('onBasketChangeRelay', this);
    },

    registerHighlighters : function(label)
    {
      label.setRich(true);
      label.graphicalModel = label.getLabel();

      label.addListener('mouseover', function(mouseEvent) {
        this.setLabel("<span style='color: #5070bf;'>" + this.graphicalModel + "</span>");
      }, label);

      label.addListener('mouseout', function(mouseEvent) {
        this.setLabel(this.graphicalModel);
      }, label);
    },

    removeBasketItem : function(index, item)
    {
      var baskets = this.basketComposite.getChildren();
      var itemContainer = baskets[index];

      itemContainer.remove(item);

      var contents = itemContainer.getChildren();
      this.debug('removeBasketItem: ' + contents);
      if (!contents || contents.length == 0) {
       var emptyBasketLabel = this.makeEmptyBasketLabel(index);

        if (emptyBasketLabel) {
          this.addFlavouredBasketItem(index, emptyBasketLabel, gazebo.ui.BasketContainer.EMPTY_BASKET_ITEM);
        }
      }

      this.fireDataEvent('onBasketChangeRelay', this);
    },

    getDirectionIcon : function(position, destination) {
      if (position > destination) {
        return 'qx/icon/Oxygen/16/actions/go-previous.png';
      } else {
        return 'qx/icon/Oxygen/16/actions/go-next.png';
      }
    },

    makeEmptyBasketLabel : function(index) {
      return null;
    }
  }
});