/*
   Copyright and License: see LICENSE file

   Contributors:
	   * Joachim Baran
 */

qx.Theme.define("gazebo.theme.Appearance",
{
  extend : qx.theme.simple.Appearance,

  appearances :
  {
    "window/captionbar" :
    {
      style : function(states)
      {
        return {
          decorator    : "window-captionbar",
          textColor    : "text-gray",
          minHeight    : 26,
          paddingRight : 2
        };
      }
    },

    "window/title" :
    {
      style : function(states)
      {
        return {
          alignY      : "middle",
          font        : "heading",
          marginLeft  : 0,
          marginRight : 12
        };
      }
    },

    "annotation" :
    {
      style : function(states)
      {
        return {
          textColor : states.selected ? "text-selected" : "text-gray"
        };
      }
    },

    "software/title" :
    {
      style : function(states)
      {
        return {
          alignY      : "middle",
          font        : "software/title",
          marginLeft  : 0,
          marginRight : 12
        };
      }
    },

    "selectbox-empty" : "selectbox",
    "selectbox-empty/atom" :
    {
      style : function(states)
      {
        return {
          textColor : 'text-gray',
          font: 'italic'
        };
      }
    },
    "selectbox-empty/popup" : "selectbox/popup",
    "selectbox-empty/list" : "selectbox/list",
    "selectbox-empty/arrow" : "selectbox/arrow",

    "fauxgroupbox" : {},

    "fauxgroupbox/legend" :
    {
      alias : "atom",

      style : function(states)
      {
        return {
          textColor : states.invalid ? "invalid" : undefined,
          padding : 0,
          margin : 0,
          font: "bold"
        };
      }
    },

    "fauxgroupbox/frame" :
    {
      style : function(states)
      {
        return {
          backgroundColor : "background",
          padding : [6, 9],
          margin: [2, 2, 2, 2],
          decorator  : "white-box"
        };
      }
    },

    "trial-frame" :
    {
      alias : "atom",

      style : function(states)
      {
        var decorator = "trial-box";

        if (states.hovered && !states.pressed && !states.checked) {
          decorator = "trial-box-hovered";
        } else if (states.hovered && (states.pressed || states.checked)) {
          decorator = "trial-box-pressed-hovered";
        } else if (states.pressed || states.checked) {
          decorator = "trial-box-pressed";
        }

        if (states.invalid && !states.disabled) {
          decorator += "-invalid";
        } else if (states.focused) {
          decorator += "-focused";
        }

        return {
          decorator : decorator,
          padding : [3, 8],
          cursor: states.disabled ? undefined : "pointer",
          minWidth: 5,
          minHeight: 5
        };
      }
    },

    "trial-frame/label" : {
      alias : "atom/label",

      style : function(states)
      {
        return {
          textColor : states.disabled ? "text-disabled" : undefined
        };
      }
    },

    "trial" :
    {
      alias : "trial-frame",
      include : "trial-frame",

      style : function(states)
      {
        return {
          center : true
        };
      }
    },

    "hover-trial" :
    {
      alias : "trial",
      include : "trial",

      style : function(states)
      {
        return {
          decorator : states.hovered ? "trial-hover" : undefined
        }
      }
    },

    "signup-frame" :
    {
      alias : "atom",

      style : function(states)
      {
        var decorator = "signup-box";

        if (states.hovered && !states.pressed && !states.checked) {
          decorator = "signup-box-hovered";
        } else if (states.hovered && (states.pressed || states.checked)) {
          decorator = "signup-box-pressed-hovered";
        } else if (states.pressed || states.checked) {
          decorator = "signup-box-pressed";
        }

        if (states.invalid && !states.disabled) {
          decorator += "-invalid";
        } else if (states.focused) {
          decorator += "-focused";
        }

        return {
          decorator : decorator,
          padding : [3, 8],
          cursor: states.disabled ? undefined : "pointer",
          minWidth: 5,
          minHeight: 5
        };
      }
    },

    "signup-frame/label" : {
      alias : "atom/label",

      style : function(states)
      {
        return {
          textColor : states.disabled ? "text-disabled" : undefined
        };
      }
    },

    "signup" :
    {
      alias : "signup-frame",
      include : "signup-frame",

      style : function(states)
      {
        return {
          center : true
        };
      }
    },

    "hover-signup" :
    {
      alias : "signup",
      include : "signup",

      style : function(states)
      {
        return {
          decorator : states.hovered ? "signup-hover" : undefined
        }
      }
    }

  }
});