/* ************************************************************************

   Copyright and License: see LICENSE file

   Contributors:
     * Joachim Baran

************************************************************************ */

/**
 * A class for splitting genotypes into their components.
 */
qx.Class.define("gazebo.fly.GenotypeReader",
{
  extend : qx.core.Object,

  construct: function()
  {
    this.base(arguments);
  },

  members:
  {
    isAtom : function(string) {
      var decomposition = this.decompose(string);

      if (decomposition.length == 1) {
        var chromosomeBag = decomposition.shift();

        if (chromosomeBag.length == 1) {
          return true;
        }
      }

      return false;
    },

    symmetricBrackets : function(string) {
      var stack = new Array();

      for (var i = 0; i < string.length; i++) {
        var character = string.charAt(i);

        switch(character) {
        case '(':
        case '[':
        case '{':
          stack.push(character);
          break;
        case ')':
        case ']':
        case '}':
          if (stack.length > 0) {
            var previousBracket = stack.pop();

            if (character == ')' && previousBracket == '(') {
              // Ok
            } else if (character == ']' && previousBracket == '[') {
              // Ok
            } else if (character == '}' && previousBracket == '{') {
              // Ok
            } else {
              return false;
            }
          } else {
            return false;
          }
        }
      }

      return stack.length == 0;
    },

    decompose : function(genotype) {
      var components = new Array();

      var chromosomes = genotype.split(';');
      var mendedChromosomes = new Array();

      for (var i = 0; i < chromosomes.length; i++) {
        var chromosome = chromosomes[i];

        if (!this.symmetricBrackets(chromosome)) {
          // Black magic. Old skool.
          for (i++; i < chromosomes.length; i++) {
            chromosome = chromosome + ';' + chromosomes[i];

            if (this.symmetricBrackets(chromosome)) {
              break;
            }
          }
        }

        mendedChromosomes.push(chromosome);
      }

      chromosomes = mendedChromosomes;

      for (i = 0; i < chromosomes.length; i++) {
        var chromosomeBag = new Array();

        chromosome = chromosomes[i];

        // Isolate '/' and ',', so we split on them too (due to the spaces)
        chromosome = chromosome.replace(/\//g, ' / ');
        chromosome = chromosome.replace(/,/g, ' , ');

        this.debug("CHROMOSOME: " + chromosome);
        // Tokens are symbols and names.
        var tokens = chromosome.split(/\s/);

        this.debug('Split ' + chromosome + ' into ' + tokens);
        for (var j = 0; j < tokens.length; j++) {
          var token = tokens[j].replace(/^\s+|\s+$/g, '');

          if (token.length == 0) {
            continue;
          }
          
          if (!this.symmetricBrackets(token)) {
            // More black magic. Still old skool.
            for (j++; j < tokens.length; j++) {
              token = token + ' ' + tokens[j].replace(/^\s+|\s+$/g, '');

              if (this.symmetricBrackets(token)) {
                break;
              }
            }
          }

          this.debug('Token: ' + token);
          chromosomeBag.push(token);
        }

        components.push(chromosomeBag);
      }

      return components;
    }
  }
});