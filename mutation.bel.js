/*!
 * Mutation [BEL.MUT] v0.1
 * https://byteeightlab.ru/#MUT
 *
 * Released under the GNU General Public License v3.0
 * http://byteeightlab.ru/source/bel_mut/LICENSE
 *
 * Date: 2023-11-01T12:00Z
 */

(()=>{
    let exercise = function( resolve, reject, in_data ){
        if( typeof in_data != 'object' || in_data.__proto__ != Object.prototype ) return resolve(true);

        let data = JSON.parse(JSON.stringify(in_data)),
            observer = null,
            observerConfig = { attributes: true, attributeFilter: [] },
            initialValues = {},
            expected = {},
            changes = false,
            stop = false,
            end = async performed => {
                if(!this.mutationPromise) return false;

                this.mutationStop = e => null;
                if(observer) observer.disconnect();
                
                if( data.trigger && !stop )
                    this.dispatchEvent(new CustomEvent('mutationComplete',{ detail: {
                        element: this,
                        trigger: data.trigger,
                        performed: performed
                    }}));

                if( performed === true && this.mutationPromise )
                    if( this.mutationPromise.queue && this.mutationPromise.queue.length )
                        return exercise.call( this, resolve, reject, this.mutationPromise.queue.shift() );
                
                this.mutationPromise = null;
                resolve(performed);
            };
        
        this.mutationStop = e => { stop = true; return end(false); };

        if( data.duration ){
            if( typeof data.duration == 'function' ){
                let dfn = data.duration;
                data.duration = { function: d => { d = parseInt(dfn(d),10); return isNaN(d)?0:d; } };
            }else if( typeof data.duration != 'number' ){
                if( data.duration.at && data.duration.at(-1) == '%' ){
                    data.duration = { percent: parseFloat(data.duration) };
                    if(isNaN(data.duration.percent)) delete data.duration;
                }else{
                    data.duration = { number: parseInt(data.duration,10) };
                    if(isNaN(data.duration.percent)) delete data.duration;
                }
            }else
                data.duration = { number: data.duration };
        }

        for(let code in data) {
            switch(code){
                case 'style':
                    if( typeof data.style != 'object' || data.style.__proto__ != Object.prototype ){
                        delete data.style;
                        continue;
                    }

                    let style = document.createElement('span').style;

                    style.cssText = this.style.cssText;

                    for(let property in data.style)
                        if ( style[property] != undefined ) 
                            style[property] = data.style[property];
                        else
                            style.setProperty( property, data.style[property] );
                    data.style = style;

                    observerConfig.attributeFilter.push('style');
                    initialValues.style = Object.assign( {}, this.style );
                    initialValues.style.cssText = this.style.cssText;
                    initialValues.style.attributeValue = this.getAttribute('style');

                    for(let i = 0, n = data.style.length; i<n; i++ ){
                        let property = data.style[i];
                        if( data.style[property] == initialValues.style[property] )
                            delete data.style[property];
                    }

                break;
                case 'class':
                    if( typeof data.class != 'object' || data.class.__proto__ != Object.prototype ){
                        delete data.class;
                        continue;
                    }

                    if( !data.class.add || !Array.isArray(data.class.add) )
                        delete data.class.add;

                    if( !data.class.remove || !Array.isArray(data.class.remove) )
                        delete data.class.remove;

                    if( !data.class.add && !data.class.remove ){
                        delete data.class;
                        continue;
                    }                    

                    if( data.class.add && data.class.remove ){
                        let intersection = data.class.remove.filter(x => data.class.add.includes(x)), key;
                        for(let i=0,n=intersection.length;i<n;i++)
                            if( ( key = data.class.remove.indexOf(intersection[i]) ) >= 0 )
                                data.class.remove = data.class.remove.slice(0,key).concat(data.class.remove.slice(key+1));
                    }

                    observerConfig.attributeFilter.push('class');
                    initialValues.class = Array.from(this.classList);

                    if(data.class.remove)
                        expected.class = initialValues.class.filter( x => !data.class.remove.includes(x) );
                    else expected.class = [];

                    if(data.class.add)
                        expected.class = [ ...new Set([ ...expected.class, ...data.class.add ]) ];
                break;
            }
        }

        if( observerConfig.attributeFilter.length == 0 )
            changes = false;
        else{
            let callback = async ( mutationsList, observer ) => {

                    if( !this.mutationPromise ) return false;

                    let complete = true, duration = 0;

                    for(let code in data)
                        switch(code){
                            case 'style':
                                if(this.style.cssText != data.style.cssText)
                                    complete = false;
                            break;
                            case 'class':
                                for(let i=0,n=data.class.length;i<n;i++)
                                    if(!this.classList.classList.contains(data.class[i])){
                                        complete = false;
                                        break;
                                    }
                            break;
                        }

                    if(complete){
                        duration = this.mutationDuration;
                        if( data.duration ){
                            if( data.duration.function )
                                duration = data.duration.function(duration);
                            else if( data.duration.number ){
                                if( data.duration.number > 0)
                                    duration = data.duration.number;
                                else
                                    duration -= data.duration.number;
                            }else if( data.duration.percent ){
                                if( data.duration.percent > 0)
                                    duration = duration/100*data.duration.percent;
                                else 
                                    duration += duration/100*data.duration.percent;
                            }
                        }

                        if( duration > 0 )
                            await sleep(duration);

                        if(!stop) end(true);
                    }
                };

            observer = new MutationObserver(callback);
            observer.observe( this, observerConfig );

            for(let code in data)
                switch(code){
                    case 'style':
                        this.style.cssText = data.style.cssText;

                        if( initialValues.style.cssText != this.style.cssText )
                            changes = true;
                        else delete data.style;

                    break;
                    case 'class':
                        if( data[code].remove )
                            this.classList.remove(...data[code].remove);
                        if( data[code].add )
                            this.classList.add(...data[code].add);

                        let classList = Array.from(this.classList);

                        if( initialValues.class
                                .filter( x => !classList.includes(x) )
                                .concat( classList.filter( x => !initialValues.class.includes(x) ) )
                                .length > 0
                        ) changes = true;
                        else delete data.class;
                    break;
                }
        }

        if(!changes){
            if( data.trigger )
                this.dispatchEvent(new CustomEvent('mutationComplete',{ detail: data.trigger }));
            end(true);
        }
    },
    mutation = async function( data ){
        if( !this.mutationPromise )
            return this.mutationPromise = new Promise( async ( resolve, reject ) => {
                exercise.call( this, resolve, reject, data );
            } );

        if( !this.mutationPromise.queue )
            this.mutationPromise.queue = [data];
        else 
            this.mutationPromise.queue.push(data);
        
        return this.mutationPromise;
    },
    mutationNodeList = function( data ){
        let promises = [];
        this.forEach( item => { promises.push(item.mutation(data)); } );
        return Promise.all(promises);
    },
    mutationNodeListStop = function(){
        this.forEach( item => item.mutationStop() );
    },
    sleep = ms => new Promise((resolve, reject) => setTimeout(e => resolve(), ms ?? 1000 ) ),
    mutationDuration = function(){
        let style = window.getComputedStyle(this),
            animationDuration = parseFloat(style.animationDuration),
            animationDelay = parseFloat(style.animationDelay),
            animationIteration = parseInt(style.animationIterationCount,10),
            transitionDuration = parseFloat(style.transitionDuration),
            transitionDelay = parseFloat(style.transitionDelay);

        if(isNaN(animationDuration)) animationDuration = 0;
        if(isNaN(animationDelay)) animationDelay = 0;
        if(isNaN(animationIteration)) animationIteration = 0;
        if(isNaN(transitionDuration)) transitionDuration = 0;
        if(isNaN(transitionDelay)) transitionDelay = 0;

        transitionDuration = transitionDelay + transitionDuration;
        animationDuration = animationDelay + animationDuration * animationIteration;

        return ( transitionDuration > animationDuration ? transitionDuration : animationDuration ) * 1000;
    };

    Element.prototype.mutation = mutation;
    Element.prototype.mutationStop = e => null;
    Element.prototype.mutationPromise = null;
    Element.prototype.__defineGetter__('mutationDuration',mutationDuration);
    
    NodeList.prototype.mutation = mutationNodeList;
    NodeList.prototype.mutationStop = mutationNodeListStop;

})();