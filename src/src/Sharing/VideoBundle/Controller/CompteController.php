<?php

namespace Sharing\VideoBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;

/**
* @Route("/compte")
*/
class CompteController extends Controller
{
    /**
     * @Route("/", name="compte")
     * @Template()
     */
    public function indexAction()
    {
        return array();
    }
}
